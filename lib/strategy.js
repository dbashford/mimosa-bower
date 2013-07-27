"use strict";
var determineTransform, logger, path, transforms, _, _isCSS, _isJavaScript, _replacePathPieces;

path = require('path');

_ = require('lodash');

logger = require('logmimosa');

transforms = {};

_isCSS = function(filePath) {
  return /.css$/.test(filePath);
};

_isJavaScript = function(filePath) {
  return /.js$/.test(filePath);
};

_replacePathPieces = function(mimosaConfig, aPath) {
  var packagePath, packagePathOutPieces, piece, _i, _len, _ref;
  if (!mimosaConfig.bower.copy.pathMod) {
    return aPath;
  }
  packagePath = aPath.replace(mimosaConfig.bower.bowerDir.pathFull, "");
  packagePathOutPieces = [];
  _ref = packagePath.split(path.sep);
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    piece = _ref[_i];
    if (!mimosaConfig.bower.copy.pathMod.test(piece)) {
      packagePathOutPieces.push(piece);
    }
  }
  return path.join(mimosaConfig.bower.bowerDir.pathFull, packagePathOutPieces.join(path.sep));
};

transforms.vendorRoot = function(mimosaConfig, inPath) {
  var fileName;
  fileName = path.basename(inPath);
  if (_isJavaScript(inPath)) {
    return path.join(mimosaConfig.vendor.javascripts, mimosaConfig.bower.copy.outRoot, fileName);
  } else {
    return path.join(mimosaConfig.vendor.stylesheets, mimosaConfig.bower.copy.outRoot, fileName);
  }
};

transforms.packageRoot = function(mimosaConfig, inPath, lib) {
  var fileName;
  fileName = path.basename(inPath);
  if (_isJavaScript(inPath)) {
    return path.join(mimosaConfig.vendor.javascripts, mimosaConfig.bower.copy.outRoot, lib, fileName);
  } else {
    return path.join(mimosaConfig.vendor.stylesheets, mimosaConfig.bower.copy.outRoot, lib, fileName);
  }
};

transforms.none = function(mimosaConfig, inPath, lib) {
  var modInPath;
  modInPath = _replacePathPieces(mimosaConfig, inPath);
  if (_isJavaScript(modInPath)) {
    return modInPath.replace(mimosaConfig.bower.bowerDir.pathFull, path.join(mimosaConfig.vendor.javascripts, mimosaConfig.bower.copy.outRoot));
  } else {
    return modInPath.replace(mimosaConfig.bower.bowerDir.pathFull, path.join(mimosaConfig.vendor.stylesheets, mimosaConfig.bower.copy.outRoot));
  }
};

transforms.custom = function(mimosaConfig, lib, inPath) {
  var matchedOverride, matchedOverrides, modInPath, modPath, overrideObject, _i, _len, _results;
  modInPath = _replacePathPieces(mimosaConfig, inPath);
  modInPath = modInPath.replace(mimosaConfig.bower.bowerDir.pathFull + path.sep, '');
  modInPath = modInPath.replace(lib + path.sep, '');
  overrideObject = mimosaConfig.bower.copy.overridesObjects[lib];
  matchedOverrides = [];
  Object.keys(overrideObject).forEach(function(oKey) {
    if (modInPath.indexOf(oKey) === 0) {
      return matchedOverrides.push(oKey);
    }
  });
  if (matchedOverrides.length === 0) {
    return;
  }
  _results = [];
  for (_i = 0, _len = matchedOverrides.length; _i < _len; _i++) {
    matchedOverride = matchedOverrides[_i];
    modPath = modInPath.replace(matchedOverride, overrideObject[matchedOverride]);
    if (_isJavaScript(modPath)) {
      _results.push(path.join(path.join(mimosaConfig.vendor.javascripts, mimosaConfig.bower.copy.outRoot), modPath));
    } else {
      _results.push(path.join(path.join(mimosaConfig.vendor.stylesheets, mimosaConfig.bower.copy.outRoot), modPath));
    }
  }
  return _results;
};

determineTransform = function(mimosaConfig, pack) {
  var theTransform, _ref;
  theTransform = (_ref = mimosaConfig.bower.copy.strategy[pack]) != null ? _ref : mimosaConfig.bower.copy.defaultStrategy;
  return transforms[theTransform];
};

module.exports = function(mimosaConfig, resolvedPaths) {
  var copyFileConfigs, inPath, inPathPieces, lib, outPath, paths, theTransform, _i, _len;
  copyFileConfigs = [];
  for (lib in resolvedPaths) {
    paths = resolvedPaths[lib];
    theTransform = determineTransform(mimosaConfig, lib);
    for (_i = 0, _len = paths.length; _i < _len; _i++) {
      inPath = paths[_i];
      if (inPath.indexOf("!!") > -1) {
        inPathPieces = inPath.split("!!");
        outPath = transforms.custom(mimosaConfig, inPathPieces[0], inPathPieces[1]);
        if (outPath) {
          copyFileConfigs.push({
            "in": inPathPieces[1],
            out: outPath
          });
        } else {
          logger.warn("Could not determine output path for [[ " + inPathPieces[1] + " ]]");
        }
      } else {
        outPath = theTransform(mimosaConfig, inPath, lib);
        copyFileConfigs.push({
          "in": inPath,
          out: [outPath]
        });
      }
    }
  }
  return copyFileConfigs;
};
