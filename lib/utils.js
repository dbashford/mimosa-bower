"use strict";
var fs, logger, path, wrench, _addResolvedPath, _cleanNames, _handlePackageJson, _isPathExcluded, _processOverridesList, _resolvePaths;

fs = require('fs');

path = require('path');

wrench = require("wrench");

logger = null;

_handlePackageJson = function(aPath) {
  var details, err, mainFolderIndexPath, mainPath, packageJson, packageJsonPath, pathStat, _ref;
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
        pathStat = fs.statSync(mainPath);
        if (pathStat.isDirectory()) {
          if (fs.existsSync(mainPath + ".js")) {
            mainPath = mainPath + ".js";
          } else {
            mainFolderIndexPath = path.join(mainPath, "index.js");
            if (fs.existsSync(mainFolderIndexPath)) {
              mainPath = mainFolderIndexPath;
            }
          }
        }
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
  var aPath, fullLibPath, installedPaths, joinedPath, lib, overridesArray, overridesObjectPaths, packageJsonDetails, pathStat, resolvedPaths, _i, _len;
  installedPaths = {};
  names.forEach(function(name) {
    return installedPaths[name] = Array.isArray(paths[name]) ? paths[name] : [paths[name]];
  });
  resolvedPaths = {};
  for (lib in installedPaths) {
    paths = installedPaths[lib];
    if (path.sep !== '/') {
      paths = paths.map(function(filePath) {
        return filePath.split('/').join(path.sep);
      });
    }
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
              if (mimosaConfig.bower.copy.unknownMainFullCopy) {
                logger.warn("Cannot determine main file for [[ " + lib + " ]] at [[ " + aPath + " ]]. Copying entire folder because unknownMainFullCopy is set to true. Consider adding a mainOverrides entry.");
                mimosaConfig.bower.copy.strategy[lib] = 'none';
                _processOverridesList(mimosaConfig, [''], fullLibPath, resolvedPaths[lib]);
              } else {
                logger.warn("Cannot determine main file for [[ " + lib + " ]] at [[ " + aPath + " ]]. Consider adding a mainOverrides entry or setting unknownMainFullCopy to true.");
              }
            }
          }
        } else {
          joinedPath = path.join(fullLibPath, aPath);
          if (fs.existsSync(joinedPath)) {
            _addResolvedPath(mimosaConfig, resolvedPaths[lib], joinedPath);
          } else {
            logger.warn("Cannot determine main file for [[ " + lib + " ]] at [[ " + aPath + " ]]. bower.json may be incorrect. Consider adding a mainOverrides entry.");
          }
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
  } else {
    return copy.exclude.indexOf(filePath) > -1;
  }
};

_cleanNames = function(installedNames, paths) {
  var cleanNames, pathLibNames;
  pathLibNames = Object.keys(paths);
  if (pathLibNames.length === installedNames.length) {
    return installedNames;
  }
  cleanNames = [];
  installedNames.forEach(function(name) {
    if (pathLibNames.indexOf(name) > -1) {
      return cleanNames.push(name);
    } else {
      return logger.warn("Bower could not find path for package [[ " + name + " ]], is it a valid Bower package?");
    }
  });
  return cleanNames;
};

exports.ensureBowerConfig = function(mimosaConfig) {
  var bowerJsonPath, err;
  logger = mimosaConfig.log;
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
    return wrench.mkdirSyncRecursive(folder, 0x1ff);
  }
};

exports.gatherPathConfigs = function(mimosaConfig, installedNames, cb) {
  var bower;
  logger = mimosaConfig.log;
  bower = require("bower");
  return bower.commands.list({
    paths: true,
    relative: false
  }).on('end', function(paths) {
    var cleanedNames, copyConfigs, resolvedPaths, strategy;
    cleanedNames = _cleanNames(installedNames, paths);
    resolvedPaths = _resolvePaths(mimosaConfig, cleanedNames, paths);
    strategy = require('./strategy');
    copyConfigs = strategy(mimosaConfig, resolvedPaths);
    return cb(copyConfigs);
  });
};
