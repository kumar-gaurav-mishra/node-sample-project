const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const ObjectId = require('mongodb').ObjectID;
const findDbName = require('../../services/velidateUser');
const update = (req, res, next, config) => {
  'use strict';
  let client, dbName;
  const schema = config.lib.joi.object().keys({
    "_id": config.lib.joi.string().required(),
    "name": config.lib.joi.string(),
    "description": config.lib.joi.string(),
    "extMatterName": config.lib.joi.string(),
    "extMatterNo": config.lib.joi.number(),
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
    let db = client.db(dbName)
    let id = ObjectId(req.body._id);
    delete req.body._id;
    delete req.body.tenantId;
    req.body.updatedAt = new Date();
    return db.collection('cases').update({
      _id: id
    }, {
      $set: req.body
    });
  }).then((data) => {
    if (client) client.close();
    return res.send({
      data: data,
      status: true
    });
  }).catch((err) => {
    if (client) client.close();
    console.log(err);
    return Promise.reject(err);
  });
}


module.exports = {
  method: 'PUT',
  type: 'cases',
  url: '/cases',
  handler: update
};