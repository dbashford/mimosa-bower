"use strict";
var bower, clean, fs, logger, path, utils, wrench, _ensureBowerConfig, _install, _logInstallErrorMessage, _makeDirectory, _moveInstalledLibs;

path = require('path');

fs = require('fs');

bower = require("bower");

wrench = require("wrench");

logger = require("logmimosa");

clean = require("./clean");

utils = require("./utils");

_install = function(mimosaConfig, cb) {
  var installs;
  bower.config.directory = mimosaConfig.bower.bowerDir.path;
  installs = [];
  logger.info("Starting Bower install...");
  return bower.commands.install().on('log', function(log) {
    if (log.level === "action" && log.id === "install") {
      if (logger.isDebug) {
        logger.debug(("Installed the following into " + mimosaConfig.bower.bowerDir.path + ": ") + log.data.endpoint.name);
      }
      return installs.push(log);
    }
  }).on('error', function(message) {
    return _logInstallErrorMessage(message);
  }).on('end', function() {
    return cb(installs);
  });
};

_logInstallErrorMessage = function(message) {
  var logMessage, pickVersions;
  logMessage = message.code === "ECONFLICT" ? (pickVersions = message.picks.map(function(pick) {
    return "" + pick.pkgMeta.name + "@" + pick.pkgMeta.version;
  }).join(", "), "" + message + ": " + pickVersions) : message.code === "EINVALID" ? "" + message + ": " + message.details : message;
  return logger.error(logMessage);
};

_ensureBowerConfig = function(mimosaConfig) {
  var bowerJsonPath, err;
  bowerJsonPath = path.join(mimosaConfig.root, "bower.json");
  try {
    require(bowerJsonPath);
    logger.debug("bower.json exists");
    return true;
  } catch (_error) {
    err = _error;
    logger.error("Error reading Bower config file [[ " + bowerJsonPath + " ]]", err);
    return false;
  }
};

_makeDirectory = function(folder) {
  if (!fs.existsSync(folder)) {
    logger.debug("Making folder [[ " + folder + " ]]");
    return wrench.mkdirSyncRecursive(folder, 0x1ff);
  }
};

_moveInstalledLibs = function(copyConfigs) {
  var copyConfig, fileText, outFile, _i, _len, _results;
  _results = [];
  for (_i = 0, _len = copyConfigs.length; _i < _len; _i++) {
    copyConfig = copyConfigs[_i];
    logger.debug("Going to create file [[ " + copyConfig.out + " ]]");
    _results.push((function() {
      var _j, _len1, _ref, _results1;
      _ref = copyConfig.out;
      _results1 = [];
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        outFile = _ref[_j];
        _makeDirectory(path.dirname(outFile));
        fileText = fs.readFileSync(copyConfig["in"], "utf8");
        fs.writeFileSync(outFile, fileText);
        _results1.push(logger.info("mimosa-bower created file [[ " + outFile + " ]]"));
      }
      return _results1;
    })());
  }
  return _results;
};

exports.bowerInstall = function(mimosaConfig, options, next) {
  if (_ensureBowerConfig(mimosaConfig)) {
    _makeDirectory(mimosaConfig.bower.bowerDir.path);
    return _install(mimosaConfig, function(installs) {
      var installedNames;
      if (installs.length > 0) {
        logger.debug("There were a total of [[ " + installs.length + " ]] bower packages installed");
        if (mimosaConfig.bower.copy.enabled) {
          installedNames = installs.map(function(install) {
            return install.data.endpoint.name;
          });
          return utils.gatherPathConfigs(mimosaConfig, installedNames, function(copyConfigs) {
            if (logger.isDebug) {
              logger.debug("Going to move the following copyConfigurations");
              logger.debug(JSON.stringify(copyConfigs, null, 2));
            }
            _moveInstalledLibs(copyConfigs);
            clean.cleanTempDir(mimosaConfig);
            return next();
          });
        }
      } else {
        logger.info("No bower packages to install.");
        return next();
      }
    });
  } else {
    return next();
  }
};
