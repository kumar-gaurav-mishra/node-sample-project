const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const findDbName = require('../../services/velidateUser');
const ObjectId = require('mongodb').ObjectID;

const update = (req, res, next, config) => {
  'use strict';
  let client, dbName, db;
  const schema = config.lib.joi.object().keys({
    "_id": config.lib.joi.string().required(),
    "docId": config.lib.joi.string(),
    "caseId": config.lib.joi.string(),
    "firstName": config.lib.joi.string(),
    "middleName": config.lib.joi.string(),
    "lastName": config.lib.joi.string(),
    "email": config.lib.joi.string(),
    "phone": config.lib.joi.string(),
    "suffix": config.lib.joi.string(),
    "socialSecurityNo": config.lib.joi.string(),
    "idOrPassportNo": config.lib.joi.string(),
    "dob": config.lib.joi.date(),
    "address1": config.lib.joi.string(),
    "address2": config.lib.joi.string(),
    "city": config.lib.joi.string(),
    "state": config.lib.joi.string(),
    "zip": config.lib.joi.string(),
    "country": config.lib.joi.string(),
    "accountNo": config.lib.joi.string(),
    "minor": config.lib.joi.boolean(),
    "others": config.lib.joi.string(),
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
    let id = ObjectId(req.body._id);
    delete req.body._id;
    delete req.body.tenantId;
    req.body.updatedAt = new Date();
    return db.collection('entites').update({
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
  type: 'entity',
  url: '/entity',
  handler: update
};