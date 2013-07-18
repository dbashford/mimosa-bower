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

transforms.vendorRoot = function(mimosaConfig, resolvedPaths) {
  return console.log("VENDOR ROOT");
};

transforms.packageRoot = function(mimosaConfig, resolvedPaths) {
  return console.log("PACKAGE ROOT");
};

transforms.packageShorten = function(mimosaConfig, resolvedPaths) {
  return console.log("PACKAGE SHORTEN");
};

transforms.none = function(mimosaConfig, resolvedPaths) {
  var copyFileConfigs, inPath, lib, modInPath, outPath, paths, _i, _len;
  copyFileConfigs = [];
  for (lib in resolvedPaths) {
    paths = resolvedPaths[lib];
    for (_i = 0, _len = paths.length; _i < _len; _i++) {
      inPath = paths[_i];
      modInPath = _replacePathPieces(mimosaConfig, inPath);
      outPath = _isJavaScript(modInPath) ? modInPath.replace(mimosaConfig.bower.bowerDir.pathFull, mimosaConfig.vendor.javascripts) : modInPath.replace(mimosaConfig.bower.bowerDir.pathFull, mimosaConfig.vendor.stylesheets);
      copyFileConfigs.push({
        "in": inPath,
        out: outPath
      });
    }
  }
  return copyFileConfigs;
};

module.exports = function(mimosaConfig, resolvedPaths) {
  return transforms[mimosaConfig.bower.copy.strategy](mimosaConfig, resolvedPaths);
};
