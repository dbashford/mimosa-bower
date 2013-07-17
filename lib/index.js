"use strict";
var bower, config, fs, logger, path, registerCommand, registration, wrench, _addResolvedPath, _bowerInstall, _clean, _ensureBowerConfig, _ensureDirectory, _handlePackageJson, _install, _isExcluded, _move, _moveInstalledLibs, _resolvePaths, _versionConflictMessage;

fs = require('fs');

path = require('path');

logger = require("logmimosa");

wrench = require("wrench");

bower = require("bower-canary");

config = require('./config');

registration = function(mimosaConfig, register) {
  /*
  e = mimosaConfig.extensions
  register ['add','update','buildFile'],      'afterCompile', _minifyJS, e.javascript
  register ['add','update','buildExtension'], 'beforeWrite',  _minifyJS, e.template
  */

};

_bowerInstall = function(mimosaConfig, options, next) {
  if (_ensureBowerConfig(mimosaConfig)) {
    _ensureDirectory(mimosaConfig);
    return _install(mimosaConfig, function(error, installs) {
      if (error) {
        console.error("Aborting Bower processing due to error.");
      } else {
        if (installs.length > 0) {
          if (mimosaConfig.bower.copy.enabled) {
            return _move(mimosaConfig, installs, function() {
              return _clean(mimosaConfig, next);
            });
          } else {
            logger.success("Bower assets installed.");
          }
        }
      }
      if (next) {
        return next();
      }
    });
  }
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

_handlePackageJson = function(aPath) {
  var details, err, mainPath, packageJson, packageJsonPath, _ref;
  packageJsonPath = path.join(aPath, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      packageJson = require(packageJsonPath);
    } catch (_error) {
      err = _error;
      logger.error("Error reading package.json at [[ " + packageJsonPath + " ]]");
      return {};
    }
    details = {};
    if (packageJson.main) {
      mainPath = path.join(aPath, packageJson.main);
      if (fs.existsSync(mainPath)) {
        details.main = mainPath;
      }
    }
    details.dependencies = (_ref = packageJson.dependencies) != null ? _ref : void 0;
    return details;
  }
};

_resolvePaths = function(mimosaConfig, names, paths) {
  var aPath, fullLibPath, installedPaths, lib, packageJsonDetails, pathStat, resolvedPaths, _i, _len;
  installedPaths = {};
  names.forEach(function(name) {
    return installedPaths[name] = paths[name].split(",");
  });
  resolvedPaths = {};
  for (lib in installedPaths) {
    paths = installedPaths[lib];
    resolvedPaths[lib] = [];
    fullLibPath = path.join(mimosaConfig.bower.bowerDir.pathFull, lib);
    if (mimosaConfig.bower.copy.mainOverrides[lib]) {
      mimosaConfig.bower.copy.mainOverrides[lib].forEach(function(override) {
        var overridePath;
        overridePath = path.join(fullLibPath, override);
        if (fs.existsSync(overridePath)) {
          return _addResolvedPath(mimosaConfig, resolvedPaths[lib], overridePath);
        }
      });
    } else {
      for (_i = 0, _len = paths.length; _i < _len; _i++) {
        aPath = paths[_i];
        if (fs.existsSync(aPath)) {
          pathStat = fs.statSync(aPath);
          if (pathStat.isFile()) {
            _addResolvedPath(mimosaConfig, resolvedPaths[lib], aPath);
          } else {
            packageJsonDetails = _handlePackageJson(aPath);
            if (packageJsonDetails != null ? packageJsonDetails.main : void 0) {
              _addResolvedPath(mimosaConfig, resolvedPaths[lib], packageJsonDetails.main);
              /*
              TODO packageJsonDetails.dependencies
              */

            } else {
              logger.info("Cannot determine main file for [[ " + lib + " ]] at [[ " + aPath + " ]]. Consider adding a mainOverrides entry.");
            }
          }
        } else {
          _addResolvedPath(mimosaConfig, resolvedPaths[lib], path.join(fullLibPath, aPath));
        }
      }
    }
  }
  return resolvedPaths;
};

_addResolvedPath = function(mimosaConfig, pathArray, thePath) {
  if (!_isExcluded(mimosaConfig.bower.copy, thePath)) {
    return pathArray.push(thePath);
  }
};

_isExcluded = function(copy, filePath) {
  if ((copy.excludeRegex != null) && filePath.match(copy.excludeRegex)) {
    return true;
  } else if (copy.exclude.indexOf(filePath) > -1) {
    return true;
  } else {
    return false;
  }
};

_moveInstalledLibs = function(mimosaConfig, resolvedPaths) {
  return console.log(JSON.stringify(resolvedPaths, null, 2));
};

_move = function(mimosaConfig, installs, cb) {
  var installedNames;
  if (installs.length > 0) {
    installedNames = installs.map(function(install) {
      return install.data.pkgMeta.name;
    });
    return bower.commands.list({
      paths: true
    }).on('end', function(paths) {
      var resolvedPaths;
      resolvedPaths = _resolvePaths(mimosaConfig, installedNames, paths);
      _moveInstalledLibs(mimosaConfig, resolvedPaths);
      return cb();
    });
  } else {
    return cb();
  }
};

_clean = function(mimosaConfig, next) {
  if (mimosaConfig.bower.bowerDir.clean && fs.existsSync(mimosaConfig.bower.bowerDir.pathFull)) {
    wrench.rmdirSyncRecursive(mimosaConfig.bower.bowerDir.pathFull);
    logger.info("Cleaned temp bower output directory [[ " + mimosaConfig.bower.bowerDir.pathFull + " ]]");
  }
  logger.success("Bower assets installed.");
  if (next) {
    return next();
  }
};

registerCommand = function(program, retrieveConfig) {
  return program.command('bower').option("-D, --debug", "run in debug mode").description("Run bower install").action(function(opts) {
    if (opts.debug) {
      logger.setDebug();
      process.env.DEBUG = true;
    }
    return retrieveConfig(false, function(mimosaConfig) {
      return _bowerInstall(mimosaConfig);
    });
  });
};

module.exports = {
  registration: registration,
  registerCommand: registerCommand,
  defaults: config.defaults,
  placeholder: config.placeholder,
  validate: config.validate
};
