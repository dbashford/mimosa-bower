"use strict";
var clean, config, install, logger, registerCommand, registration, _callIfModuleIncluded, _debug, _prepBowerClean, _prepBowerInstall;

logger = require("logmimosa");

config = require('./config');

clean = require('./clean');

install = require('./install');

registration = function(mimosaConfig, register) {
  if (!(mimosaConfig.bower.copy.trackChanges === false && mimosaConfig.bower.copy.clean === true)) {
    return register(['preBuild'], 'init', install.bowerInstall);
  }
};

_debug = function(opts) {
  if (opts.debug) {
    logger.setDebug();
    return process.env.DEBUG = true;
  }
};

_callIfModuleIncluded = function(mimosaConfig, opts, cb) {
  var ms;
  ms = mimosaConfig.modules;
  if (ms.indexOf("bower") > -1 || ms.indexOf("mimosa-bower") > -1) {
    return cb(mimosaConfig, opts);
  } else {
    return logger.error("You have called the bower command on a project that does not have bower included.\nTo include bower, add \"bower\" to the \"modules\" array.");
  }
};

_prepBowerInstall = function(retrieveConfig, opts) {
  _debug(opts);
  return retrieveConfig(false, function(mimosaConfig) {
    return _callIfModuleIncluded(mimosaConfig, opts, install.bowerInstall);
  });
};

_prepBowerClean = function(retrieveConfig, opts) {
  _debug(opts);
  return retrieveConfig(false, function(mimosaConfig) {
    return _callIfModuleIncluded(mimosaConfig, opts, clean.bowerClean);
  });
};

registerCommand = function(program, retrieveConfig) {
  program.command('bower').option("-D, --debug", "run in debug mode").description("Run bower install").action(function(opts) {
    return _prepBowerInstall(retrieveConfig, opts);
  });
  program.command('bower:install').option("-D, --debug", "run in debug mode").description("Run bower install").action(function(opts) {
    return _prepBowerInstall(retrieveConfig, opts);
  });
  return program.command('bower:clean').option("-c, --cache", "also clean the cache").option("-D, --debug", "run in debug mode").description("Removes all discoverable installed bower modules from source code and removes temp directory.").action(function(opts) {
    return _prepBowerClean(retrieveConfig, opts);
  });
};

module.exports = {
  registration: registration,
  registerCommand: registerCommand,
  defaults: config.defaults,
  placeholder: config.placeholder,
  validate: config.validate
};
