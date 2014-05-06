"use strict";
var bower, cleanTempDir, fs, logger, path, utils, wrench, _, _cleanCache, _cleanEmptyDirs, _cleanFilesViaBower, _cleanFilesViaTrackingInfo, _cleanInstalledLibs, _removeDirs, _removeFile;

fs = require('fs');

path = require('path');

_ = require('lodash');

wrench = require("wrench");

utils = require('./utils');

logger = null;

bower = null;

_removeFile = function(fileName) {
  var err;
  try {
    fs.unlinkSync(fileName);
    return logger.info("Removed file [[ " + fileName + " ]]");
  } catch (_error) {
    err = _error;
    return logger.warn("Unable to clean file [[ " + fileName + " ]], was it moved from this location or already cleaned?");
  }
};

_cleanInstalledLibs = function(copyConfigs) {
  var copyConfig, _i, _len, _results;
  _results = [];
  for (_i = 0, _len = copyConfigs.length; _i < _len; _i++) {
    copyConfig = copyConfigs[_i];
    _results.push(copyConfig.out.forEach(_removeFile));
  }
  return _results;
};

_removeDirs = function(dirs) {
  var dir, err, _i, _len, _results;
  _results = [];
  for (_i = 0, _len = dirs.length; _i < _len; _i++) {
    dir = dirs[_i];
    try {
      fs.rmdirSync(dir);
      _results.push(logger.info("Cleaned up empty bower package directory [[ " + dir + " ]]"));
    } catch (_error) {
      err = _error;
      if (err.code !== 'ENOTEMPTY') {
        _results.push(logger.error("Unable to delete directory, [[ " + dir + " ]] :", err));
      } else {
        _results.push(void 0);
      }
    }
  }
  return _results;
};

exports.cleanTempDir = cleanTempDir = function(mimosaConfig, force) {
  if ((force || mimosaConfig.bower.bowerDir.clean) && fs.existsSync(mimosaConfig.bower.bowerDir.pathFull)) {
    wrench.rmdirSyncRecursive(mimosaConfig.bower.bowerDir.pathFull);
    return mimosaConfig.log.info("Cleaned temp bower output directory [[ " + mimosaConfig.bower.bowerDir.pathFull + " ]]");
  }
};

_cleanEmptyDirs = function(mimosaConfig, packages) {
  var allDirs, cssDirs, jsDirs;
  jsDirs = [];
  if (fs.existsSync(mimosaConfig.vendor.javascripts)) {
    jsDirs = wrench.readdirSyncRecursive(mimosaConfig.vendor.javascripts).map(function(dir) {
      return path.join(mimosaConfig.vendor.javascripts, dir);
    });
  }
  cssDirs = [];
  if (fs.existsSync(mimosaConfig.vendor.stylesheets)) {
    cssDirs = wrench.readdirSyncRecursive(mimosaConfig.vendor.stylesheets).map(function(dir) {
      return path.join(mimosaConfig.vendor.stylesheets, dir);
    });
  }
  allDirs = _.uniq(jsDirs.concat(cssDirs));
  if (mimosaConfig.bower.copy.outRoot) {
    packages.push(mimosaConfig.bower.copy.outRoot);
  }
  allDirs = allDirs.filter(function(dir) {
    return _.intersection(dir.split(path.sep), packages).length > 0;
  });
  allDirs = _.sortBy(allDirs, function(dir) {
    return dir.length;
  }).reverse();
  return _removeDirs(allDirs);
};

_cleanCache = function() {
  var error;
  logger.info("Cleaning Bower cache...");
  error = false;
  return bower.commands.cache.clean().on('log', function(log) {}).on('error', function(message) {
    logger.error("Error cleaning cache", message);
    return error = true;
  }).on('end', function() {
    if (!error) {
      return logger.success("Bower cache cleaned.");
    }
  });
};

_cleanFilesViaBower = function(mimosaConfig) {
  return bower.commands.list({
    paths: true
  }).on('end', function(paths) {
    var packages;
    packages = Object.keys(paths);
    return utils.gatherPathConfigs(mimosaConfig, packages, function(copyConfigs) {
      _cleanInstalledLibs(copyConfigs);
      cleanTempDir(mimosaConfig, true);
      if (mimosaConfig.bower.copy.strategy !== "vendorRoot") {
        _cleanEmptyDirs(mimosaConfig, packages);
      }
      return logger.success("Bower files cleaned.");
    });
  });
};

_cleanFilesViaTrackingInfo = function(mimosaConfig) {
  var installedFiles, track;
  track = require('./track');
  installedFiles = track.getPreviousInstalledFileList(mimosaConfig);
  if (installedFiles.length === 0) {
    logger.info("No files to clean.");
  } else {
    installedFiles.map(function(installedFile) {
      return path.join(mimosaConfig.root, installedFile);
    }).forEach(_removeFile);
  }
  track.removeTrackFiles(mimosaConfig);
  return logger.success("Bower files cleaned.");
};

exports.bowerClean = function(mimosaConfig, opts) {
  var hasBowerConfig;
  logger = mimosaConfig.log;
  if (!bower) {
    bower = require("bower");
  }
  hasBowerConfig = utils.ensureBowerConfig(mimosaConfig);
  if (!hasBowerConfig) {
    return;
  }
  bower.config.directory = mimosaConfig.bower.bowerDir.path;
  if (opts.cache) {
    _cleanCache();
  }
  if (mimosaConfig.bower.copy.trackChanges === true) {
    return _cleanFilesViaTrackingInfo(mimosaConfig);
  } else {
    return _cleanFilesViaBower(mimosaConfig);
  }
};
