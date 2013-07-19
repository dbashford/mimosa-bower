"use strict";
var bower, clean, fs, logger, path, utils, wrench, _ensureBowerConfig, _ensureDirectory, _install, _moveInstalledLibs, _versionConflictMessage;

path = require('path');

fs = require('fs');

bower = require("bower-canary");

wrench = require("wrench");

logger = require("logmimosa");

clean = require("./clean");

utils = require("./utils");

_install = function(mimosaConfig, cb) {
  var error, installs;
  bower.config.directory = mimosaConfig.bower.bowerDir.path;
  error = false;
  installs = [];
  return bower.commands.install().on('log', function(log) {
    if (log.level === "action" && log.id === "install") {
      return installs.push(log);
    }
  }).on('error', function(message) {
    var logMessage;
    logMessage = message.code === "ECONFLICT" ? _versionConflictMessage(message) : void 0;
    logger.error(logMessage != null ? logMessage : message);
    return error = true;
  }).on('end', function() {
    return cb(error, installs);
  });
};

_versionConflictMessage = function(data) {
  var pickVersions;
  pickVersions = data.picks.map(function(pick) {
    return "" + pick.pkgMeta.name + "@" + pick.pkgMeta.version;
  }).join(", ");
  return "" + data + ": " + pickVersions;
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
  folder = mimosaConfig.bower.bowerDir.path;
  if (!fs.existsSync(folder)) {
    wrench.mkdirSyncRecursive(folder, 0x1ff);
  }
  if (next) {
    return next();
  }
};

_moveInstalledLibs = function(copyConfigs) {
  var copyConfig, fileText, outDirectory, _i, _len, _results;
  _results = [];
  for (_i = 0, _len = copyConfigs.length; _i < _len; _i++) {
    copyConfig = copyConfigs[_i];
    outDirectory = path.dirname(copyConfig.out);
    if (!fs.existsSync(outDirectory)) {
      wrench.mkdirSyncRecursive(outDirectory, 0x1ff);
    }
    fileText = fs.readFileSync(copyConfig["in"], "utf8");
    fs.writeFileSync(copyConfig.out, fileText);
    _results.push(logger.info("mimosa-bower created file [[ " + copyConfig.out + " ]]"));
  }
  return _results;
};

exports.bowerInstall = function(mimosaConfig, options, next) {
  if (_ensureBowerConfig(mimosaConfig)) {
    _ensureDirectory(mimosaConfig);
    return _install(mimosaConfig, function(error, installs) {
      var installedNames;
      if (error) {
        logger.error("Aborting Bower processing due to error: ", error);
      } else {
        if (installs.length > 0) {
          if (mimosaConfig.bower.copy.enabled) {
            installedNames = installs.map(function(install) {
              return install.data.pkgMeta.name;
            });
            return utils.gatherPathConfigs(mimosaConfig, installedNames, function(copyConfigs) {
              _moveInstalledLibs(copyConfigs);
              clean.cleanTempDir(mimosaConfig);
              return next();
            });
          }
        } else {
          logger.info("No bower packages to install.");
        }
      }
      return next();
    });
  } else {
    return next();
  }
};
