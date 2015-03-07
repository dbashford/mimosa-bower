"use strict";
var config, path, registerCommand, registration, track, _, _callIfModuleIncluded, _watch;

path = require('path');

_ = require('lodash');

config = require('./config');

track = require('./track');

registration = function(mimosaConfig, register) {
  var install;
  if (!(mimosaConfig.bower.copy.trackChanges === false && mimosaConfig.bower.copy.clean === true)) {
    install = require('./install');
    register(['preBuild'], 'init', install.bowerInstall);
  }
  if (mimosaConfig.isWatch && mimosaConfig.bower.watch) {
    return _watch(mimosaConfig);
  }
};

_watch = function(mimosaConfig) {
  var bowerJsonPath, watcher;
  bowerJsonPath = path.join(mimosaConfig.root, "bower.json");
  watcher = require("chokidar");
  return watcher.watch(bowerJsonPath, {
    persistent: true
  }).on('change', function() {
    var install;
    install = require('./install');
    return install.bowerInstall(mimosaConfig);
  });
};

_callIfModuleIncluded = function(mimosaConfig, opts, cb) {
  var bowerModule;
  bowerModule = _.find(mimosaConfig.modules, function(mod) {
    return mod.indexOf("bower") === 0 || mod.indexOf("mimosa-bower") === 0;
  });
  if (bowerModule) {
    return cb(mimosaConfig, opts);
  } else {
    return mimosaConfig.log.error("You have called the bower command on a project that does not have bower included.\nTo include bower, add \"bower\" to the \"modules\" array.");
  }
};

registerCommand = function(program, logger, retrieveConfig) {
  program.command('bower').option("-D, --mdebug", "run in debug mode").description("Run bower install").action(function(opts) {
    var retrieveConfigOpts;
    retrieveConfigOpts = {
      buildFirst: false,
      mdebug: !!opts.mdebug
    };
    return retrieveConfig(retrieveConfigOpts, function(mimosaConfig) {
      var install;
      install = require('./install');
      return _callIfModuleIncluded(mimosaConfig, opts, install.bowerInstall);
    });
  });
  program.command('bower:install <names>').option("-D, --mdebug", "run in debug mode").option("-d, --savedev", "save to dev dependencies instead of dependencies").description("Install a library and update the bower.json accordingly").action(function(names, opts) {
    var retrieveConfigOpts;
    names = names.split(',');
    opts.names = names;
    retrieveConfigOpts = {
      buildFirst: false,
      mdebug: !!opts.mdebug
    };
    return retrieveConfig(retrieveConfigOpts, function(mimosaConfig) {
      var install;
      install = require('./install');
      return _callIfModuleIncluded(mimosaConfig, opts, install.installLibrary);
    });
  });
  return program.command('bower:clean').option("-c, --cache", "also clean the cache").option("-D, --mdebug", "run in debug mode").description("Removes all discoverable installed bower modules from source code and removes temp directory.").action(function(opts) {
    var retrieveConfigOpts;
    retrieveConfigOpts = {
      buildFirst: false,
      mdebug: !!opts.mdebug
    };
    return retrieveConfig(retrieveConfigOpts, function(mimosaConfig) {
      var clean;
      clean = require('./clean');
      return _callIfModuleIncluded(mimosaConfig, opts, clean.bowerClean);
    });
  });
};

module.exports = {
  registration: registration,
  registerCommand: registerCommand,
  defaults: config.defaults,
  placeholder: config.placeholder,
  validate: config.validate,
  isInstallNeeded: track.isInstallNeeded
};
