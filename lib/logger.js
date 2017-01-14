var _, bunyan;

_ = require('underscore');

bunyan = require('bunyan');

module.exports = (function() {
  function _Class(config) {
    if (config == null) {
      config = {};
    }
    return bunyan.createLogger(_.defaults(config, {
      serializers: bunyan.stdSerializers,
      streams: [
        {
          level: 'info',
          stream: process.stdout
        }
      ]
    }));
  }

  return _Class;

})();
