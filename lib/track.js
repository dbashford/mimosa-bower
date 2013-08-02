"use strict";
var fs, logger, path, utils, _, _isEqual, _lastInstallBowerJSONPath, _lastInstalledFileListPath, _lastMimosaConfigJSONPath, _readBowerJSON, _writeInstalledFiles, _writeJSON;

path = require('path');

fs = require('fs');

_ = require('lodash');

logger = require('logmimosa');

utils = require("./utils");

_writeJSON = function(json, outPath) {
  var jsonString;
  jsonString = JSON.stringify(json, null, 2);
  utils.makeDirectory(path.dirname(outPath));
  return fs.writeFileSync(outPath, jsonString);
};

_readBowerJSON = function(mimosaConfig) {
  var bowerJSONPath;
  bowerJSONPath = path.join(mimosaConfig.root, "bower.json");
  return require(bowerJSONPath);
};

_lastInstallBowerJSONPath = function(mimosaConfig) {
  return path.join(mimosaConfig.root, '.mimosa', 'bower', 'last-install.json');
};

_lastMimosaConfigJSONPath = function(mimosaConfig) {
  return path.join(mimosaConfig.root, '.mimosa', 'bower', 'last-mimosa-config.json');
};

_lastInstalledFileListPath = function(mimosaConfig) {
  return path.join(mimosaConfig.root, '.mimosa', 'bower', 'last-installed-files.json');
};

_isEqual = function(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

exports.track = function(mimosaConfig, installedFiles) {
  var bowerConfigOutPath, bowerJSON, bowerJSONOutPath, currentBowerConfig;
  bowerConfigOutPath = _lastMimosaConfigJSONPath(mimosaConfig);
  currentBowerConfig = _.cloneDeep(mimosaConfig.bower);
  currentBowerConfig.bowerDir.pathFull = "";
  _writeJSON(currentBowerConfig, bowerConfigOutPath);
  bowerJSON = _readBowerJSON(mimosaConfig);
  bowerJSONOutPath = _lastInstallBowerJSONPath(mimosaConfig);
  _writeJSON(bowerJSON, bowerJSONOutPath);
  return _writeInstalledFiles(mimosaConfig, installedFiles);
};

_writeInstalledFiles = function(mimosaConfig, installedFiles) {
  var filesMinusRoot, installedFile, outPath;
  outPath = _lastInstalledFileListPath(mimosaConfig);
  filesMinusRoot = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = installedFiles.length; _i < _len; _i++) {
      installedFile = installedFiles[_i];
      _results.push(installedFile.replace(mimosaConfig.root + path.sep, ''));
    }
    return _results;
  })();
  return _writeJSON(filesMinusRoot, outPath);
};

exports.removeTrackFiles = function(mimosaConfig) {
  return [_lastInstallBowerJSONPath(mimosaConfig), _lastMimosaConfigJSONPath(mimosaConfig), _lastInstalledFileListPath(mimosaConfig)].forEach(function(filepath) {
    if (fs.existsSync(filepath)) {
      return fs.unlinkSync(filepath);
    }
  });
};

exports.getPreviousInstalledFileList = function(mimosaConfig) {
  var err, installedFilePath;
  installedFilePath = _lastInstalledFileListPath(mimosaConfig);
  try {
    return require(installedFilePath);
  } catch (_error) {
    err = _error;
    logger.debug(err);
    return [];
  }
};

exports.isInstallNeeded = function(mimosaConfig) {
  var currentBowerConfig, currentBowerJSON, err, oldBowerConfig, oldBowerJSON;
  try {
    oldBowerJSON = require(_lastInstallBowerJSONPath(mimosaConfig));
    logger.debug("Found old bower json");
  } catch (_error) {
    err = _error;
    logger.debug("Could not find old bower json, install needed", err);
    return true;
  }
  try {
    oldBowerConfig = require(_lastMimosaConfigJSONPath(mimosaConfig));
    logger.debug("Found old bower config");
  } catch (_error) {
    err = _error;
    logger.debug("Could not find old bower config, install needed", err);
    return true;
  }
  currentBowerConfig = _.cloneDeep(mimosaConfig.bower);
  currentBowerConfig.bowerDir.pathFull = '';
  currentBowerJSON = _readBowerJSON(mimosaConfig);
  if (_isEqual(currentBowerConfig, oldBowerConfig) && _isEqual(currentBowerJSON, oldBowerJSON)) {
    logger.debug("Old bower config matches current, and older bower.json matches current");
    return false;
  } else {
    return true;
  }
};
