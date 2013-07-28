"use strict";
var clean, config, install, logger, registerCommand, registration, _debug, _prepBowerClean, _prepBowerInstall;

logger = require("logmimosa");

config = require('./config');

clean = require('./clean');

install = require('./install');

registration = function(mimosaConfig, register) {
  return register(['preBuild'], 'init', install.bowerInstall);
};

_debug = function(opts) {
  if (opts.debug) {
    logger.setDebug();
    return process.env.DEBUG = true;
  }
};

_prepBowerInstall = function(retrieveConfig, opts) {
  _debug(opts);
  return retrieveConfig(false, function(mimosaConfig) {
    return install.bowerInstall(mimosaConfig);
  });
};

_prepBowerClean = function(retrieveConfig, opts) {
  _debug(opts);
  return retrieveConfig(false, function(mimosaConfig) {
    return clean.bowerClean(mimosaConfig);
  });
};

registerCommand = function(program, retrieveConfig) {
  program.command('bower').option("-D, --debug", "run in debug mode").description("Run bower install").action(function(opts) {
    return _prepBowerInstall(retrieveConfig, opts);
  });
  program.command('bower:install').option("-D, --debug", "run in debug mode").description("Run bower install").action(function(opts) {
    return _prepBowerInstall(retrieveConfig, opts);
  });
  return program.command('bower:clean').option("-D, --debug", "run in debug mode").description("Removes all discoverable installed bower modules from source code and removes temp directory.").action(function(opts) {
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
