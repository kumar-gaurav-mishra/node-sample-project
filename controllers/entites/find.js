const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const ObjectId = require('mongodb').ObjectID;
const findDbName = require('../../services/velidateUser');
const _ = require('lodash');
const find = (req, res, next, config) => {
  'use strict';
  let client, db, dbName;
  const schema = config.lib.joi.object().keys({
    "tenantId": config.lib.joi.string().required(),
    "name": config.lib.joi.string().required()
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
    return new Promise((resolve, reject) => {
      return db.collection('entites').find({
        $or: [{
            firstName: new RegExp(req.query.name, 'i')
          },
          {
            middleName: new RegExp(req.query.name, 'i')
          },
          {
            lastName: new RegExp(req.query.name, 'i')
          }
        ]
      }).toArray((err, data) => {
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
  type: 'entity',
  url: '/find',
  handler: find
};