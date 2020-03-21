const update = (req, res, next, config) => {
  const mongodb = require('mongodb');
  const MongoClient = mongodb.MongoClient;
  const ObjectId = require('mongodb').ObjectID;
  let client;
  const schema = config.lib.joi.object().keys({
    "_id": config.lib.joi.string().required(),
    "tenantId": config.lib.joi.string().required(),
    "name": config.lib.joi.string(),
    "email": config.lib.joi.string(),
    "password": config.lib.joi.string()
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
    let db = client.db(config.db)
    let id = ObjectId(req.body._id);
    delete req.body._id;
    delete req.body.tenantId;
    req.body.updatedAt = new Date();
    return db.collection('users').update({
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
  type: 'users',
  url: '/users',
  handler: update
};