const create = (req, res, next, config) => {
  const mongodb = require('mongodb');
  const MongoClient = mongodb.MongoClient;
  const ObjectId = require('mongodb').ObjectID;
  const dbHandler = require('../../services/dbHandler');
  let client, resp, db, admin = {
    createdAt: new Date(),
    updatedAt: new Date(),
    role: "admin"
  };
  const schema = config.lib.joi.object().keys({
    "name": config.lib.joi.string().required(),
    "zylabServer": config.lib.joi.string(),
    "legalHoldProServer": config.lib.joi.string(),
    "modules": config.lib.joi.array(),
    "email": config.lib.joi.string().required(),
    "password": config.lib.joi.string().required(),
    "url": config.lib.joi.string().required(),
    "appLinks": config.lib.joi.array(),
    "orgId": config.lib.joi.string().required()
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
    req.body.createdAt = new Date();
    req.body.updatedAt = new Date();
    admin.name = req.body.name;
    admin.email = req.body.email;
    admin.password = req.body.password;
    delete req.body.email;
    delete req.body.password;
    return db.collection('tenants').insertOne(req.body);
  }).then((data) => {
    resp = data.ops[0];
    admin.tenantId = resp._id;
    return db.collection('users').insertOne(admin);
  }).then(() => {
    dbHandler(config, req.body.orgId);
    if (client) client.close();
    return res.send({
      data: resp,
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
  type: 'tenants',
  url: '/tenants',
  handler: create
};