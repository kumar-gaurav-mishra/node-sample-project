const tenants = (req, res, next, config) => {
  const mongodb = require('mongodb');
  const MongoClient = mongodb.MongoClient;
  const ObjectId = require('mongodb').ObjectID;
  let client, db,
    count = 0,
    limit = 20,
    offset = 0;
  const schema = config.lib.joi.object().keys({
    "_id": config.lib.joi.string(),
    "name": config.lib.joi.string(),
    "limit": config.lib.joi.string(),
    "offset": config.lib.joi.string()
  });
  return new Promise((resolve, reject) => {
    return config.lib.joi.validate(req.query, schema, (err) => {
      if (err) {
        console.log("Error : ", err);
        return reject(err);
      }
      return resolve();
    });
  }).then(() => {
    return new Promise((resolve, reject) => {
      MongoClient.connect(`${config.dbPath}${config.db}`, (err, dbclient) => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        return resolve(dbclient);
      });
    });
  }).then((database) => {
    client = database;
    db = client.db(config.db);
    if (req.query._id)
      req.query._id = ObjectId(req.query._id);
    if (req.query.limit) {
      limit = +req.query.limit;
      delete req.query.limit;
    }
    if (req.query.offset) {
      offset = +req.query.offset;
      delete req.query.offset;
    }
    return db.collection('tenants').find(req.query).count();
  }).then((cnt) => {
    count = cnt;
    return new Promise((resolve, reject) => {
      return db.collection('tenants').aggregate([{
          $match: req.query
        }, {
          $sort: {
            createdAt: -1
          }
        },
        {
          $skip: offset
        },
        {
          $limit: limit
        }
      ]).toArray((err, data) => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        return resolve(data);
      });
    });
  }).then((data) => {
    if (!data) data = [];
    if (client) client.close();
    return res.send({
      count: count,
      data: data
    });
  }).catch((err) => {
    if (client) client.close();
    console.log(err);
    return Promise.reject(err);
  });
}

module.exports = {
  method: 'GET',
  type: 'tenants',
  url: '/tenants',
  handler: tenants
};