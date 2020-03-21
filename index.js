const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const envs = require('envs')('NODE_ENV');
const config = require('./config.json')[envs || 'dev'];
const routes = require('./routes');
const migration = require('./db/migration');
const scheduleJob = require('./services/manage-duplicates');
config.lib = {
  fs: require('fs'),
  request: require('request'),
  joi: require('joi'),
  path: require('path'),
  '_': require('lodash')
}
config.root = __dirname;
migration(config);
scheduleJob(config);
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const subpath = express();
//Swagger configurations started
//app.use("/v1", subpath);
const swagger = require("swagger-node-express").createNew(subpath);
app.use(express.static('dist'));
app.use(cors());
subpath.get('/', (req, res) => {
  res.sendfile(__dirname + '/dist/index.html');
});
swagger.configureSwaggerPaths('', 'api-docs', '');
swagger.configure(config.domain + "/docs/", '1.0.0');
//Swagger configurations ended
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(function(req, res, next) {
  res.setHeader('X-Powered-By', 'GodSpeed');
  next()
});
routes(app, config);
// if (cluster.isMaster) {
//   for (let i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }
// } else {
const server = app.listen(config.port, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log("Gc-suite API Server is listening at %s:%s", config.domain, config.port);
});
// }

app.use((req, res, next) => {
  res.status(404).send("Not Found");
});
process.on('uncaughtException', (err) => {
  console.log('Caught exception: %j', err);
  process.exit(1);
});