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
  var err;
  try {
    require(path.join(mimosaConfig.root, "bower.json"));
    logger.debug("bower.json exists");
    return true;
  } catch (_error) {
    err = _error;
    logger.error("Unable to import bower packages: error reading bower.json file, ", err);
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
  var copyConfig, fileText, _i, _len, _results;
  _results = [];
  for (_i = 0, _len = copyConfigs.length; _i < _len; _i++) {
    copyConfig = copyConfigs[_i];
    logger.debug("Going to create file [[ " + copyConfig.out + " ]]");
    _makeDirectory(path.dirname(copyConfig.out));
    fileText = fs.readFileSync(copyConfig["in"], "utf8");
    fs.writeFileSync(copyConfig.out, fileText);
    _results.push(logger.info("mimosa-bower created file [[ " + copyConfig.out + " ]]"));
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
