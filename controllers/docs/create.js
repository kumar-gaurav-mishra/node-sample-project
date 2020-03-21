const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const findDbName = require('../../services/velidateUser');
const ObjectId = require('mongodb').ObjectID;

const create = (req, res, next, config) => {
  'use strict';
  let client, dbName, db, rsp;
  const schema = config.lib.joi.object().keys({
    "docId": config.lib.joi.string().required(),
    "caseId": config.lib.joi.string().required(),
    "title": config.lib.joi.string().required(),
    "comments": config.lib.joi.array(),
    "tenantId": config.lib.joi.string().required()
  });
  return new Promise((resolve, reject) => {
    return config.lib.joi.validate(req.body, schema, (err) => {
      if (err) {
        console.log("Error : ", err);
        return reject(err);
      }
      return resolve();
    });
  }).then(() => {
    return findDbName(config, req.body.tenantId);
  }).then((data) => {
    delete req.body.tenantId;
    dbName = data.orgId;
    return new Promise((resolve, reject) => {
      MongoClient.connect(`${config.dbPath}${dbName}`, (err, dbclient) => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        return resolve(dbclient);
      });
    });
  }).then((database) => {
    client = database;
    db = client.db(dbName)
    req.body.createdAt = new Date();
    req.body.updatedAt = new Date();
    req.body.caseId = ObjectId(req.body.caseId);
    req.body.entityCount = 0;
    return db.collection('docs').insertOne(req.body);
  }).then((data) => {
    rsp = data.ops[0]
    return db.collection('cases').update({
      _id: req.body.caseId
    }, {
      $inc: {
        docCount: 1
      }
    });
  }).then(() => {
    if (client) client.close();
    return res.send({
      data: rsp,
      status: true
    });
  }).catch((err) => {
    if (client) client.close();
    console.log(err);
    return Promise.reject(err);
  });
}

module.exports = {
  method: 'POST',
  type: 'docs',
  url: '/docs',
  handler: create
};