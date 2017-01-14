var APP_DIR, Logger, SphereClient, app, client, domain, env, express, gracefullyExiting, handleTearDown, logStream, logger, path, pkg, port, ref, server;

path = require('path');

domain = require('domain');

express = require('express');

Logger = require('./logger');

SphereClient = require('sphere-node-sdk').SphereClient;

APP_DIR = path.join(__dirname, '../');

pkg = require(APP_DIR + "package.json");

server = null;

gracefullyExiting = false;

app = express();

env = app.get('env');

ref = (function() {
  switch (env) {
    case 'production':
      return {
        port: 3200,
        logStream: [
          {
            level: 'info',
            path: "/var/log/" + pkg.name + "/log"
          }
        ]
      };
    default:
      return {
        port: 3000,
        logStream: [
          {
            level: 'info',
            stream: process.stdout
          }
        ]
      };
  }
})(), port = ref.port, logStream = ref.logStream;

logger = new Logger({
  name: pkg.name,
  streams: logStream
});

server = require('http').createServer(app);

logger.info("Starting express application on port " + port + " (" + env + ")");

handleTearDown = function() {
  gracefullyExiting = true;
  logger.info('Attempting gracefully shutdown of server, waiting for remaining connections to complete.');
  server.close(function() {
    logger.info('No more connections, shutting down server.');
    return process.exit();
  });
  return setTimeout(function() {
    logger.error('Could not close connections in time, forcefully shutting down.');
    return process.exit(1);
  }, 30 * 1000);
};

process.on('SIGINT', handleTearDown);

process.on('SIGTERM', handleTearDown);

app.set('port', port);

app.set('views', APP_DIR + "views");

app.set('view engine', 'jade');

app.set('trust proxy', true);

app.use('/assets', express["static"](APP_DIR + "assets"));

app.use(require('./middleware/logger')(logger));

app.use(function(req, res, next) {
  var requestDomain;
  requestDomain = domain.create();
  requestDomain.add(req);
  requestDomain.add(res);
  requestDomain.on('error', next);
  return requestDomain.run(next);
});

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Accept, Content-Type, Origin');
  if (req.method === 'OPTIONS') {
    return res.status(200).send();
  } else {
    return next();
  }
});

app.use(function(req, res, next) {
  if (!gracefullyExiting) {
    return next();
  }
  res.setHeader('Connection', 'close');
  return res.status(502).send({
    message: 'Server is in the process of restarting.'
  });
});

app.use(require('serve-favicon')(APP_DIR + "assets/images/favicon.ico"));

app.use(require('multer')());

app.use(require('body-parser').json());

app.use(require('body-parser').urlencoded({
  extended: false
}));

app.use(require('cookie-parser')());

app.use(require('cookie-session')({
  secret: 'iamasecret'
}));

app.use(require('compression')());

app.use(function(err, req, res, next) {
  logger.error(err);
  return res.status(500).send({
    message: 'Oops, something went wrong!'
  });
});

client = new SphereClient(require('../config'));

require('./routes')(app, client);

server.listen(port);

logger.info("Listening for HTTP on http://localhost:" + port);

module.exports = app;
