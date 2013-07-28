"use strict"

path = require 'path'
fs = require 'fs'

utils = require "./utils"

_writeJSON = (json, outPath) ->
  jsonString = JSON.stringify json, null, 2
  utils.makeDirectory path.dirname(outPath)
  fs.writeFileSync outPath, jsonString

exports.track = (mimosaConfig) ->
  bowerConfigOutPath = path.join mimosaConfig.root, '.mimosa', 'bower.lastmimosaconfig.json'
  _writeJSON mimosaConfig.bower, bowerConfigOutPath

  bowerJSONPath = path.join mimosaConfig.root, "bower.json"
  bowerJSON = require bowerJSONPath
  bowerJSONOutPath = path.join mimosaConfig.root, '.mimosa', 'bower.lastinstall.json'
  _writeJSON bowerJSON, bowerJSONOutPath