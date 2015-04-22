// Generated by CoffeeScript 1.9.0
(function() {
  var Promise, chalk, configd, fs, path, routers, _, _readFile, _writeFile;

  chalk = require('chalk');

  Promise = require('bluebird');

  _ = require('lodash');

  routers = require('./routers');

  path = require('path');

  fs = require('fs');

  Promise.promisifyAll(fs);

  _readFile = function(source) {
    var _handler;
    _handler = null;
    configd._routes.some(function(route) {
      if (source.match(route.route)) {
        _handler = route.handler;
        return true;
      }
    });
    if (toString.call(_handler) !== '[object Function]') {
      throw new Error("  Source of " + source + " does not match any route");
    }
    return _handler(source).then(function(data) {
      var ext;
      if (toString.call(data) !== '[object String]') {
        return data;
      }
      ext = path.extname(source).toLowerCase();
      switch (ext) {
        case '.json':
          data = JSON.parse(data);
          break;
        case '.js':
          data = eval(data);
          break;
        default:
          throw new Error("File extension " + ext + " is not supported now!");
      }
      return data;
    });
  };

  _writeFile = function(filename, data) {
    var dir;
    dir = path.dirname(filename);
    return fs.existsAsync(dir).then(function(exists) {
      if (exists) {
        return;
      }
      return fs.mkdirAsync(dir);
    }).then(function() {
      return fs.writeFileAsync(filename, data);
    });
  };


  /**
   * Start define primary configd process
   * @param  {Array} sources - An array of sources
   * @param  {String} destination - Destination to write config data
   * @param  {Object} options - Other options
   * @return {Promise} configs - Merged configs
   */

  configd = function(sources, destination, options) {
    return Promise.all(sources.map(_readFile)).then(function(configs) {
      var config;
      config = configs.reduce(function(x, y) {
        return _.merge(x, y);
      });
      return _writeFile(destination, JSON.stringify(config, null, 2)).then(function() {
        return config;
      });
    });
  };

  configd._routes = [];

  configd.route = function(pattern, fn) {
    return configd._routes.push({
      route: pattern,
      handler: fn
    });
  };

  configd.route(/^http(s)?:\/\//, routers.http);

  configd.route(/.*/, routers.local);

  configd.routers = routers;

  module.exports = configd;

}).call(this);