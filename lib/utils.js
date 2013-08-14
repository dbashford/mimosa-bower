"use strict";
var bower, fs, logger, path, strategy, wrench, _addResolvedPath, _handlePackageJson, _isPathExcluded, _processOverridesList, _resolvePaths;

fs = require('fs');

path = require('path');

bower = require("bower");

logger = require("logmimosa");

wrench = require("wrench");

strategy = require('./strategy');

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

_processOverridesList = function(mimosaConfig, overrides, libPath, resolvedPaths, lib) {
  if ((overrides != null) && overrides.length > 0) {
    return overrides.forEach(function(override) {
      var overridePath, pathStat;
      overridePath = path.join(libPath, override);
      if (fs.existsSync(overridePath)) {
        pathStat = fs.statSync(overridePath);
        if (pathStat.isDirectory()) {
          return wrench.readdirSyncRecursive(overridePath).map(function(filePath) {
            return path.join(overridePath, filePath);
          }).filter(function(filePath) {
            return fs.statSync(filePath).isFile();
          }).forEach(function(filePath) {
            return _addResolvedPath(mimosaConfig, resolvedPaths, filePath, lib);
          });
        } else {
          return _addResolvedPath(mimosaConfig, resolvedPaths, overridePath, lib);
        }
      } else {
        return logger.info("Override path listed, but does not exist in package: [[ " + overridePath + " ]]");
      }
    });
  }
};

_resolvePaths = function(mimosaConfig, names, paths) {
  var aPath, fullLibPath, installedPaths, lib, overridesArray, overridesObjectPaths, packageJsonDetails, pathStat, resolvedPaths, _i, _len;
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
      logger.debug("Lib [[ " + lib + " ]] has overrides");
      overridesArray = mimosaConfig.bower.copy.overridesArrays[lib];
      _processOverridesList(mimosaConfig, overridesArray, fullLibPath, resolvedPaths[lib]);
      overridesObjectPaths = mimosaConfig.bower.copy.overridesObjects[lib] ? Object.keys(mimosaConfig.bower.copy.overridesObjects[lib]) : void 0;
      _processOverridesList(mimosaConfig, overridesObjectPaths, fullLibPath, resolvedPaths[lib], lib);
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
              logger.warn("Cannot determine main file for [[ " + lib + " ]] at [[ " + aPath + " ]]. Consider adding a mainOverrides entry.");
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

_addResolvedPath = function(mimosaConfig, pathArray, thePath, prependPack) {
  if (!_isPathExcluded(mimosaConfig.bower.copy, thePath)) {
    if (prependPack) {
      thePath = "" + prependPack + "!!" + thePath;
    }
    if (!(pathArray.indexOf(thePath) > -1)) {
      return pathArray.push(thePath);
    }
  }
};

_isPathExcluded = function(copy, filePath) {
  if ((copy.excludeRegex != null) && filePath.match(copy.excludeRegex)) {
    return true;
  } else if (copy.exclude.indexOf(filePath) > -1) {
    return true;
  } else {
    return false;
  }
};

exports.ensureBowerConfig = function(mimosaConfig) {
  var bowerJsonPath, err;
  bowerJsonPath = path.join(mimosaConfig.root, "bower.json");
  try {
    require(bowerJsonPath);
    logger.debug("bower.json exists");
    return true;
  } catch (_error) {
    err = _error;
    logger.warn("Error reading Bower config file [[ " + bowerJsonPath + " ]]", err);
    logger.info("If you do not wish to use Bower, remove 'bower' from the mimosa-config modules array");
    return false;
  }
};

exports.makeDirectory = function(folder) {
  if (!fs.existsSync(folder)) {
    logger.debug("Making folder [[ " + folder + " ]]");
    return wrench.mkdirSyncRecursive(folder, 0x1ff);
  }
};

exports.gatherPathConfigs = function(mimosaConfig, installedNames, cb) {
  return bower.commands.list({
    paths: true
  }).on('end', function(paths) {
    var copyConfigs, resolvedPaths;
    resolvedPaths = _resolvePaths(mimosaConfig, installedNames, paths);
    copyConfigs = strategy(mimosaConfig, resolvedPaths);
    return cb(copyConfigs);
  });
};
