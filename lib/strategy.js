"use strict";
var path, transforms, _, _isCSS, _isJavaScript, _replacePathPieces;

path = require('path');

_ = require('lodash');

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
    return path.join(mimosaConfig.vendor.javascripts, fileName);
  } else {
    return path.join(mimosaConfig.vendor.stylesheets, fileName);
  }
};

transforms.packageRoot = function(mimosaConfig, inPath, lib) {
  var fileName;
  fileName = path.basename(inPath);
  if (_isJavaScript(inPath)) {
    return path.join(mimosaConfig.vendor.javascripts, lib, fileName);
  } else {
    return path.join(mimosaConfig.vendor.stylesheets, lib, fileName);
  }
};

transforms.packageShorten = function(mimosaConfig, resolvedPaths) {
  return console.log("PACKAGE SHORTEN");
};

transforms.none = function(mimosaConfig, inPath) {
  var modInPath;
  modInPath = _replacePathPieces(mimosaConfig, inPath);
  if (_isJavaScript(modInPath)) {
    return modInPath.replace(mimosaConfig.bower.bowerDir.pathFull, mimosaConfig.vendor.javascripts);
  } else {
    return modInPath.replace(mimosaConfig.bower.bowerDir.pathFull, mimosaConfig.vendor.stylesheets);
  }
};

module.exports = function(mimosaConfig, resolvedPaths) {
  var copyFileConfigs, inPath, lib, outPath, paths, theTransform, _i, _len;
  theTransform = transforms[mimosaConfig.bower.copy.strategy];
  copyFileConfigs = [];
  for (lib in resolvedPaths) {
    paths = resolvedPaths[lib];
    for (_i = 0, _len = paths.length; _i < _len; _i++) {
      inPath = paths[_i];
      outPath = theTransform(mimosaConfig, inPath, lib);
      copyFileConfigs.push({
        "in": inPath,
        out: outPath
      });
    }
  }
  return copyFileConfigs;
};
