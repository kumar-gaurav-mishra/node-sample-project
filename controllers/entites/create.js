const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const findDbName = require('../../services/velidateUser');
const ObjectId = require('mongodb').ObjectID;

const create = (req, res, next, config) => {
  'use strict';
  let client, dbName, db, rsp, docId, id;
  const schema = config.lib.joi.object().keys({
    "_id": config.lib.joi.string(),
    "docId": config.lib.joi.string(),
    "caseId": config.lib.joi.string(),
    "firstName": config.lib.joi.string().required(),
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
    if (req.body.caseId) req.body.caseId = ObjectId(req.body.caseId);
    if (req.body.docId) {
      docId = ObjectId(req.body.docId);
      delete req.body.docId;
    }
    if (req.body._id) {
      id = ObjectId(req.body._id)
      delete req.body._id;
    }
    if (id) {
      return db.collection('entites').updateOne({
        _id: id
      }, {
        $set: req.body
      });
    } else {
      return db.collection('entites').insertOne(req.body);
    }
  }).then((data) => {
    rsp = data.ops[0];
    if (docId & caseId) {
      if (!id) {
        id = rsp._id
      }
      return db.collection('docEntity').insertOne({
        docId: docId,
        entityId: id,
        caseId: ObjectId(req.body.caseId) || ""
      });
    } else {
      return Promise.resolve();
    }
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
  type: 'entity',
  url: '/entity',
  handler: create
};