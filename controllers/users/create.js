const create = (req, res, next, config) => {
  const mongodb = require('mongodb');
  const MongoClient = mongodb.MongoClient;
  const ObjectId = require('mongodb').ObjectID;
  let client;
  const schema = config.lib.joi.object().keys({
    "name": config.lib.joi.string(),
    "email": config.lib.joi.string().required(),
    "tenantId": config.lib.joi.string().required(),
    "password": config.lib.joi.string().required(),
    "role": config.lib.joi.string()
  });
  return new Promise((resolve, reject) => {
    return config.lib.joi.validate(req.body, schema, (err) => {
      if (err) {
        console.log("Error : ", err);
        return reject(err);
      }
      return resolve();
    });
  }).then((data) => {
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
    let db = client.db(config.db);
    req.body.createdAt = new Date();
    req.body.updatedAt = new Date();
    req.body.caseAccess = [];
    req.body.tenantId = ObjectId(req.body.tenantId);
    if (!req.body.role) req.body.role = "user";
    return db.collection('users').insertOne(req.body);
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
  type: 'users',
  url: '/users',
  handler: create
};