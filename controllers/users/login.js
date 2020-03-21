const login = (req, res, next, config) => {
  const mongodb = require('mongodb');
  const MongoClient = mongodb.MongoClient;
  let client;
  const schema = config.lib.joi.object().keys({
    "email": config.lib.joi.string().required(),
    "password": config.lib.joi.string().required()
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
    return db.collection('users').findOne({
      email: req.body.email,
      password: req.body.password
    });
  }).then((data) => {
    if (client) client.close();
    let obj = {};
    if (data) {
      obj.data = data;
      obj.status = true;
    } else {
      obj.data = [];
      obj.status = false;
    }
    return res.send(obj);
  }).catch((err) => {
    if (client) client.close();
    console.log(err);
    return Promise.reject(err);
  });
}

module.exports = {
  method: 'POST',
  type: 'users',
  url: '/login',
  handler: login
};