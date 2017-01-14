var expressify, useragent;

useragent = require('useragent');

expressify = function(req, res, cb) {
  var httpVersion, ip, message, meta, method, ref, ref1, ref2, referer, status, ua, url;
  status = res.statusCode;
  method = req.method;
  url = req.url || '-';
  referer = req.header('referer') || '-';
  ua = useragent.parse(req.header('user-agent'));
  httpVersion = req.httpVersionMajor + "." + req.httpVersionMinor;
  ip = ip || req.ip || ((ref = req.socket) != null ? ref.remoteAddress : void 0) || ((ref1 = req.socket) != null ? (ref2 = ref1.socket) != null ? ref2.remoteAddresss : void 0 : void 0) || '127.0.0.1';
  meta = {
    remoteAddress: ip,
    method: method,
    url: url,
    referer: referer,
    'user-agent': ua,
    body: req.body && req.body.toString && req.body.toString().substring(0, Math.max(req.body.toString().length, 20)),
    'http-version': httpVersion,
    statusCode: status,
    req: req,
    res: res
  };
  message = [ip, '- -', method, url, "HTTP/" + httpVersion, status, res.get('Content-Length'), referer, ua.family, ua.major + "." + ua.minor, ua.os].join(' ');
  return cb(meta, message);
};

module.exports = function(logger) {
  return function(req, res, next) {
    var expressLogger;
    expressLogger = logger.child({
      widget_type: 'express'
    });
    return expressify(req, res, function(meta, message) {
      if (meta.url.indexOf('/assets') < 0) {
        expressLogger.info(message);
      } else {
        expressLogger.debug(message);
      }
      res.on('finish', function() {
        return expressLogger.debug(meta, message);
      });
      return next();
    });
  };
};
