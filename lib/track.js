"use strict";
var fs, path, utils, _writeJSON;

path = require('path');

fs = require('fs');

utils = require("./utils");

_writeJSON = function(json, outPath) {
  var jsonString;
  jsonString = JSON.stringify(json, null, 2);
  utils.makeDirectory(path.dirname(outPath));
  return fs.writeFileSync(outPath, jsonString);
};

exports.track = function(mimosaConfig) {
  var bowerConfigOutPath, bowerJSON, bowerJSONOutPath, bowerJSONPath;
  bowerConfigOutPath = path.join(mimosaConfig.root, '.mimosa', 'bower.lastmimosaconfig.json');
  _writeJSON(mimosaConfig.bower, bowerConfigOutPath);
  bowerJSONPath = path.join(mimosaConfig.root, "bower.json");
  bowerJSON = require(bowerJSONPath);
  bowerJSONOutPath = path.join(mimosaConfig.root, '.mimosa', 'bower.lastinstall.json');
  return _writeJSON(bowerJSON, bowerJSONOutPath);
};
