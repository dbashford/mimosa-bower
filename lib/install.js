"use strict";
var bower, fs, logger, path, track, utils, _install, _logForcedMessage, _logInstallErrorMessage, _moveInstalledLibs, _postInstall;

path = require('path');

fs = require('fs');

utils = require("./utils");

track = require("./track");

logger = null;

bower = null;

_install = function(mimosaConfig, _installOptions, cb) {
  var installOpts, installs, names;
  bower.config.directory = mimosaConfig.bower.bowerDir.path;
  installs = [];
  names = void 0;
  installOpts = {
    forceLatest: mimosaConfig.bower.copy.forceLatest
  };
  if (_installOptions) {
    installOpts.save = _installOptions.save;
    installOpts.saveDev = _installOptions.saveDev;
    names = _installOptions.names;
  } else {
    installOpts.save = true;
  }
  logger.info("Starting Bower install...");
  return bower.commands.install(names, installOpts).on('log', function(log) {
    if (log.level === "action" && log.id === "install") {
      if (logger.isDebug()) {
        logger.debug(("Installed the following into [[ " + mimosaConfig.bower.bowerDir.path + " ]]: ") + log.data.endpoint.name);
      }
      return installs.push(log);
    } else if (log.level === 'conflict' && log.id === 'solved' && log.data.forced) {
      return _logForcedMessage(log);
    }
  }).on('error', function(message) {
    _logInstallErrorMessage(message);
    return cb([]);
  }).on('end', function() {
    return cb(installs);
  });
};

_logForcedMessage = function(log) {
  var picks, suitMeta;
  picks = log.data.picks.map(function(pick) {
    return pick.pkgMeta.name + "@" + pick.pkgMeta.version;
  });
  suitMeta = log.data.suitable.pkgMeta;
  return logger.warn("mimosa-bower used forceLatest and picked [[ " + suitMeta.name + "@" + suitMeta.version + " ]] from [[ " + (picks.join(', ')) + " ]]");
};

_logInstallErrorMessage = function(message) {
  var logMessage, pickVersions;
  logMessage = message.code === "ECONFLICT" ? (pickVersions = message.picks.map(function(pick) {
    return "" + pick.pkgMeta.name + "@" + pick.pkgMeta.version;
  }).join(", "), "" + message + ": " + pickVersions) : message.code === "EINVALID" ? "" + message + ": " + message.details : message.code === "ENOGIT" ? "Mimosa is trying to use Bower which depends on having git installed, but Bower cannot find git. " + "If you do not wish to install git or use Bower, you can remove \"bower\" from the list of modules " + "in the mimosa-config." : message;
  return logger.error(logMessage);
};

_moveInstalledLibs = function(copyConfigs) {
  var copyConfig, fileBuffer, installedFiles, outFile, _i, _j, _len, _len1, _ref;
  installedFiles = [];
  for (_i = 0, _len = copyConfigs.length; _i < _len; _i++) {
    copyConfig = copyConfigs[_i];
    logger.debug("Going to create file [[ " + copyConfig.out + " ]]");
    _ref = copyConfig.out;
    for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
      outFile = _ref[_j];
      utils.makeDirectory(path.dirname(outFile));
      fileBuffer = fs.readFileSync(copyConfig["in"]);
      fs.writeFileSync(outFile, fileBuffer);
      installedFiles.push(outFile);
      logger.info("mimosa-bower created file [[ " + outFile + " ]]");
    }
  }
  return installedFiles;
};

_postInstall = function(mimosaConfig, isSingleLibraryInstall, next) {
  utils.makeDirectory(mimosaConfig.bower.bowerDir.path);
  return function(installs) {
    var installedNames;
    if (installs.length > 0) {
      logger.debug("There were a total of [[ " + installs.length + " ]] bower packages installed");
      if (mimosaConfig.bower.copy.enabled) {
        installedNames = installs.map(function(install) {
          return install.data.endpoint.name;
        });
        return utils.gatherPathConfigs(mimosaConfig, installedNames, function(copyConfigs) {
          var clean, installFiles;
          if (logger.isDebug()) {
            logger.debug("Going to move the following copyConfigurations");
            logger.debug(JSON.stringify(copyConfigs, null, 2));
          }
          installFiles = _moveInstalledLibs(copyConfigs);
          clean = require("./clean");
          clean.cleanTempDir(mimosaConfig);
          if (mimosaConfig.bower.copy.trackChanges) {
            track.track(mimosaConfig, installFiles, isSingleLibraryInstall);
          }
          if (next) {
            return next();
          }
        });
      } else {
        if (next) {
          return next();
        }
      }
    } else {
      logger.info("No bower packages were installed.");
      if (next) {
        return next();
      }
    }
  };
};

exports.installLibrary = function(mimosaConfig, opts) {
  var hasBowerConfig, libraryOptions;
  if (!logger) {
    logger = mimosaConfig.log;
  }
  if (!bower) {
    bower = require("bower");
  }
  hasBowerConfig = utils.ensureBowerConfig(mimosaConfig);
  libraryOptions = {
    names: opts.names,
    save: hasBowerConfig && !opts.savedev,
    saveDev: hasBowerConfig && opts.savedev
  };
  return _install(mimosaConfig, libraryOptions, _postInstall(mimosaConfig, true));
};

exports.bowerInstall = function(mimosaConfig, options, next) {
  var hasBowerConfig;
  if (!logger) {
    logger = mimosaConfig.log;
  }
  if (!bower) {
    bower = require("bower");
  }
  hasBowerConfig = utils.ensureBowerConfig(mimosaConfig);
  if (!hasBowerConfig) {
    if (next) {
      next();
    }
    return;
  }
  if (mimosaConfig.bower.copy.trackChanges) {
    if (!track.isInstallNeeded(mimosaConfig)) {
      logger.info("No Bower installs needed.");
      if (next) {
        next();
      }
      return;
    }
  }
  return _install(mimosaConfig, void 0, _postInstall(mimosaConfig, false, next));
};
