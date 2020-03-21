const users = (req, res, next, config) => {
  const mongodb = require('mongodb');
  const MongoClient = mongodb.MongoClient;
  const ObjectId = require('mongodb').ObjectID;
  let client, db,
    count = 0,
    limit = 20,
    offset = 0,
    dbName;
  const schema = config.lib.joi.object().keys({
    "limit": config.lib.joi.number().integer(),
    "offset": config.lib.joi.number().integer(),
    "name": config.lib.joi.string(),
    "email": config.lib.joi.string(),
    "_id": config.lib.joi.string(),
    "tenantId": config.lib.joi.string().required()
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
    req.query.tenantId = ObjectId(req.query.tenantId);
    if (req.query._id) req.query._id = ObjectId(req.query._id);
    if (req.query.limit) {
      limit = +req.query.limit
      delete req.query.limit;
    }
    if (req.query.offset) {
      offset = +req.query.offset;
      delete req.query.offset;
    }
    return db.collection('users').find({
      tenantId: req.query.tenantId
    }).count();
  }).then((cnt) => {
    count = cnt;
    return new Promise((resolve, reject) => {
      return db.collection('users').aggregate([{
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
      count: count,
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
  type: 'users',
  url: '/users',
  handler: users
};