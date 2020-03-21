const _ = require('lodash');
const controllers = (dir, config) => {
  return config.lib.fs.statSync(dir).isDirectory() ? config.lib.fs.readdirSync(dir).map(f => controllers(config.lib.path.join(dir, f), config)) : dir;
};
module.exports = (app, config) => {
  config.lib._.flattenDeep(controllers(`${config.root}/controllers`, config)).forEach((path) => {
    const route = require(path);
    app[route.method.toLowerCase()](`${config.baseUrl}${route.url}`, (req, res, next) => {
      return route.handler(req, res, next, config).catch((err) => {
        let error = handleError(err);
        res.status(error.code).send({
          message: error.message
        });
      });
    });
  });
};

function handleError(err) {
  if ((err.name && err.name == "ValidationError") || err.ValidationError) {
    return {
      code: 400,
      message: err.details[0].message || err.ValidationError,
      status: false
    }
  }
  return {
    code: 500,
    message: "Internal Server Error occured",
    status: false
  }
}