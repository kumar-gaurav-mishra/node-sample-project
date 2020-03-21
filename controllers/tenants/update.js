const update = (req, res, next, config) => {
  const mongodb = require('mongodb');
  const MongoClient = mongodb.MongoClient;
  const ObjectId = require('mongodb').ObjectID;
  let client;
  const schema = config.lib.joi.object().keys({
    "_id": config.lib.joi.string().required(),
    "name": config.lib.joi.string(),
    "zylabServer": config.lib.joi.string(),
    "legalHoldProServer": config.lib.joi.string(),
    "modules": config.lib.joi.array(),
    "url": config.lib.joi.string(),
    "appLinks": config.lib.joi.array(),
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
    req.body.updatedAt = new Date();
    return db.collection('tenants').update({
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
  type: 'tenants',
  url: '/tenants',
  handler: update
};