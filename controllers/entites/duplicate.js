const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const ObjectId = require('mongodb').ObjectID;
const findDbName = require('../../services/velidateUser');
const _ = require('lodash');
const get = (req, res, next, config) => {
  'use strict';
  let client, db, dbName, count = 0,
    limit = 20,
    offset = 0;
  const schema = config.lib.joi.object().keys({
    "tenantId": config.lib.joi.string().required(),
    "docId": config.lib.joi.string(),
    "caseId": config.lib.joi.string(),
    "limit": config.lib.joi.number().integer(),
    "offset": config.lib.joi.number().integer()
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
    return findDbName(config, req.query.tenantId);
  }).then((data) => {
    delete req.query.tenantId;
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
    db = client.db(dbName);
    if (req.query.docId) req.query.docId = ObjectId(req.query.docId);
    if (req.query.caseId) req.query.caseId = ObjectId(req.query.caseId);
    return db.collection('caseEntityDups').find(req.query).count();
  }).then((cnt) => {
    count = cnt;
    if (req.query.limit) {
      limit = +req.query.limit;
      delete req.query.limit;
    }
    if (req.query.offset) {
      offset = +req.query.offset;
      delete req.query.offset;
    }
    return new Promise((resolve, reject) => {
      return db.collection('caseEntityDups').aggregate([{
          "$match": req.query
        },
        {
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
      data: data,
      count: count
    });
  }).catch((err) => {
    if (client) client.close();
    console.log(err);
    return Promise.reject(err);
  });
}

module.exports = {
  method: 'GET',
  type: 'entity',
  url: '/duplicate',
  handler: get
};