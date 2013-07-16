"use strict";
var bower, config, fs, logger, path, registerCommand, registration, wrench, _bowerInstall, _clean, _ensureBowerConfig, _ensureDirectory, _install, _move;

fs = require('fs');

path = require('path');

logger = require("logmimosa");

wrench = require("wrench");

bower = require("bower");

config = require('./config');

registration = function(mimosaConfig, register) {
  /*
  e = mimosaConfig.extensions
  register ['add','update','buildFile'],      'afterCompile', _minifyJS, e.javascript
  register ['add','update','buildExtension'], 'beforeWrite',  _minifyJS, e.template
  */

};

_bowerInstall = function(mimosaConfig, options, next) {
  if (_ensureBowerConfig(mimosaConfig)) {
    _ensureDirectory(mimosaConfig);
    return _install(mimosaConfig, function(error) {
      if (error) {
        console.error("Aborting Bower processing due to error.");
        if (next()) {
          return next();
        }
      } else {
        return _move(mimosaConfig, function() {
          return _clean(mimosaConfig, function() {
            return logger.success("Bower assets installed.");
          });
        });
      }
    });
  }
};

_ensureBowerConfig = function(mimosaConfig) {
  var err;
  try {
    require(path.join(mimosaConfig.root, "bower.json"));
    return true;
  } catch (_error) {
    err = _error;
    logger.error("Error reading bower.json file: ", err);
    return false;
  }
};

_ensureDirectory = function(mimosaConfig, options, next) {
  var folder;
  folder = mimosaConfig.bower.outputDir.path;
  if (!fs.existsSync(folder)) {
    wrench.mkdirSyncRecursive(folder, 0x1ff);
  }
  if (next) {
    return next();
  }
};

_install = function(mimosaConfig, cb) {
  var error;
  bower.config.directory = mimosaConfig.bower.outputDir.path;
  error = false;
  return bower.commands.install().on('data', logger.info).on('error', function(message) {
    logger.error(message);
    return error = true;
  }).on('end', function() {
    return cb(error);
  });
};

_move = function(mimosaConfig, cb) {
  return cb();
};

_clean = function(mimosaConfig, cb) {
  if (mimosaConfig.bower.outputDir.clean) {
    wrench.rmdirSyncRecursive(mimosaConfig.bower.outputDir.pathFull);
    logger.info("Cleaned temp bower output directory [[ " + mimosaConfig.bower.outputDir.pathFull + " ]]");
  }
  return cb();
};

registerCommand = function(program, retrieveConfig) {
  return program.command('bower').description("Run bower install").action(function() {
    return retrieveConfig(false, function(mimosaConfig) {
      return _bowerInstall(mimosaConfig);
    });
  });
};

module.exports = {
  registration: registration,
  registerCommand: registerCommand,
  defaults: config.defaults,
  placeholder: config.placeholder,
  validate: config.validate
};
