"use strict";
var config, path, registerCommand, registration, track, _callIfModuleIncluded, _prepBowerClean, _prepBowerInstall, _prepBowerLibraryInstall, _watch;

path = require('path');

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
  var ms;
  ms = mimosaConfig.modules;
  if (ms.indexOf("bower") > -1 || ms.indexOf("mimosa-bower") > -1) {
    return cb(mimosaConfig, opts);
  } else {
    return mimosaConfig.log.error("You have called the bower command on a project that does not have bower included.\nTo include bower, add \"bower\" to the \"modules\" array.");
  }
};

_prepBowerInstall = function(retrieveConfig, opts) {
  return retrieveConfig(false, !!opts.mdebug, function(mimosaConfig) {
    var install;
    install = require('./install');
    return _callIfModuleIncluded(mimosaConfig, opts, install.bowerInstall);
  });
};

_prepBowerLibraryInstall = function(retrieveConfig, names, opts) {
  opts.names = names;
  return retrieveConfig(false, !!opts.mdebug, function(mimosaConfig) {
    var install;
    install = require('./install');
    return _callIfModuleIncluded(mimosaConfig, opts, install.installLibrary);
  });
};

_prepBowerClean = function(retrieveConfig, opts) {
  return retrieveConfig(false, !!opts.mdebug, function(mimosaConfig) {
    var clean;
    clean = require('./clean');
    return _callIfModuleIncluded(mimosaConfig, opts, clean.bowerClean);
  });
};

registerCommand = function(program, retrieveConfig) {
  program.command('bower').option("-D, --mdebug", "run in debug mode").description("Run bower install").action(function(opts) {
    return _prepBowerInstall(retrieveConfig, opts);
  });
  program.command('bower:install <names>').option("-D, --mdebug", "run in debug mode").option("-d, --savedev", "save to dev dependencies instead of dependencies").description("Install a library and update the bower.json accordingly").action(function(names, opts) {
    names = names.split(',');
    return _prepBowerLibraryInstall(retrieveConfig, names, opts);
  });
  return program.command('bower:clean').option("-c, --cache", "also clean the cache").option("-D, --mdebug", "run in debug mode").description("Removes all discoverable installed bower modules from source code and removes temp directory.").action(function(opts) {
    return _prepBowerClean(retrieveConfig, opts);
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
