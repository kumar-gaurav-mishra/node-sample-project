//let schedule = require('node-schedule');
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const ObjectId = require('mongodb').ObjectID;
const _ = require('lodash');
var schedule = require('node-schedule');
let client, db;
module.exports = (config) => {
  var j = schedule.scheduleJob('04 01 1-31 1-12 0-6', function() {
    console.log('========scheduler started======');
    return new Promise((resolve, reject) => {
      MongoClient.connect(`${config.dbPath}${config.db}`, (err, dbclient) => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        return resolve(dbclient);
      });
    }).then((database) => {
      client = database;
      db = client.db(config.db);
      return new Promise((resolve, reject) => {
        return db.collection('tenants').find().toArray((err, data) => {
          if (err) {
            console.log(err);
            return reject(err);
          }
          return resolve(data);
        });
      });
    }).then((tenants) => {
      return manageDupsTenants(config, db, tenants);
    }).catch((err) => {
      console.log("==========err========", err);
    });
  });
}

function manageDupsTenants(config, db, tenants, idx) {
  if (!idx) {
    idx = 0;
  }
  if (idx < tenants.length) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(`${config.dbPath}${tenants[idx].orgId}`, (err, dbclient) => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        return resolve(dbclient);
      });
    }).then((database) => {
      client = database;
      db = client.db(config.db);
      return manageDups(db, tenants[idx]._id);
    }).then(() => {
      if (client) client.close();
      ++idx;
      if (idx < tenants.length) {
        return manageDupsTenants(config, db, tenants, idx);
      } else {
        return;
      }
    }).catch((err) => {
      if (client) client.close();
      console.log(`Error for tenant ${tenants[idx].name}`, JSON.stringify(err));
      ++idx;
      if (idx < tenants.length) {
        return manageDupsTenants(config, db, tenants, idx);
      } else {
        return;
      }
    });
  } else {
    return;
  }
}

function manageDups(db, tenantId) {
  if (!tenantId) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    return db.collection('docEntity').aggregate([{
      $match: {
        caseId: {
          $exists: true
        }
      }
    }, {
      $lookup: {
        from: "entites",
        localField: "entityId",
        foreignField: "_id",
        as: "entity"
      }
    }]).toArray((err, data) => {
      if (err) {
        console.log(err);
        return reject(err);
      }
      return resolve(data);
    });
  }).then((data) => {
    let cases = _.compact(_.map(data, "caseId"));
    data = _.groupBy(data, "caseId");
    let finalArr = [];
    cases.forEach((caseId) => {
      finalArr.concat(findDups(data[caseId]));
    });
    return updateEntites(db, cases, finalArr);
  }).then(() => {
    if (client) client.close();
    console.log("========completed=======");
    return Promise.resolve();
  }).catch((err) => {
    console.log(err);
    return Promise.reject(err);
  });
}

function findDups(data) {
  if (!data) {
    return [];
  }
  let arr = [];
  data.forEach((val1) => {
    val1.duplicates = [];
    val1.potentialDuplicates = false;
    data.forEach((val2) => {
      if (val1._id != val2._id) {
        if (val1.entity.email == val2.entity.email) {
          val1.duplicates.push({
            _id: val2._id,
            entity: val2.entity
          });
          val1.potentialDuplicates = true;
        } else if (val1.entity.phone == val2.entity.phone) {
          val1.duplicates.push({
            _id: val2._id,
            entity: val2.entity
          });
          val1.potentialDuplicates = true;
        } else if ((val1.entity.firstName + val1.entity.middleName + val1.entity.lastName) == (val2.entity.firstName + val2.entity.middleName + val2.entity.lastName)) {
          val1.duplicates.push({
            _id: val2._id,
            entity: val2.entity
          });
          val1.potentialDuplicates = true;
        }
      }
    });
  });
  return arr;
}

function updateEntites(db, cases, finalArr) {
  if (!cases) {
    return Promise.resolve({
      message: "NO Case Found"
    });
  }
  return db.collection('caseEntityDups').removeMany({
    caseId: {
      $in: cases
    }
  }).then(() => {
    console.log("------final----", finalArr);
    finalArr = [{
      entity: {},
      potentialDuplicates: false,
      docId: 123,
      entityId: 222
    }]
    return db.collection('caseEntityDups').insertMany(finalArr, {
      upsert: true
    });
  }).catch((err) => {
    return Promise.reject(err);
  });
}