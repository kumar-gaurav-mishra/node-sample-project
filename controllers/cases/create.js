const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const findDbName = require('../../services/velidateUser');

const create = (req, res, next, config) => {
  'use strict';
  let client, dbName;
  const schema = config.lib.joi.object().keys({
    "name": config.lib.joi.string().required(),
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
    let db = client.db(dbName)
    req.body.createdAt = new Date();
    req.body.updatedAt = new Date();
    req.body.docCount = 0;
    return db.collection('cases').insertOne(req.body);
  }).then((data) => {
    if (client) client.close();
    return res.send({
      data: data.ops[0],
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
  type: 'cases',
  url: '/cases',
  handler: create
};