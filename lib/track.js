"use strict";
var fs, logger, path, utils, _isEqual, _lastInstallBowerJSONPath, _lastMimosaConfigJSONPath, _readBowerJSON, _writeJSON;

path = require('path');

fs = require('fs');

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
  return path.join(mimosaConfig.root, '.mimosa', 'bower.lastinstall.json');
};

_lastMimosaConfigJSONPath = function(mimosaConfig) {
  return path.join(mimosaConfig.root, '.mimosa', 'bower.lastmimosaconfig.json');
};

_isEqual = function(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

exports.track = function(mimosaConfig) {
  var bowerConfigOutPath, bowerJSON, bowerJSONOutPath;
  bowerConfigOutPath = _lastMimosaConfigJSONPath(mimosaConfig);
  _writeJSON(mimosaConfig.bower, bowerConfigOutPath);
  bowerJSON = _readBowerJSON(mimosaConfig);
  bowerJSONOutPath = _lastInstallBowerJSONPath(mimosaConfig);
  return _writeJSON(bowerJSON, bowerJSONOutPath);
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
  currentBowerConfig = mimosaConfig.bower;
  currentBowerJSON = _readBowerJSON(mimosaConfig);
  if (_isEqual(currentBowerConfig, oldBowerConfig) && _isEqual(currentBowerJSON, oldBowerJSON)) {
    logger.debug("Old bower config matches current, and older bower.json matches current");
    return false;
  } else {
    return true;
  }
};
