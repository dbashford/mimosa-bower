"use strict"

path = require 'path'
fs = require 'fs'

_ = require 'lodash'
logger = require 'logmimosa'

utils = require "./utils"

_writeJSON = (json, outPath) ->
  jsonString = JSON.stringify json, null, 2
  utils.makeDirectory path.dirname(outPath)
  fs.writeFileSync outPath, jsonString

_readBowerJSON = (mimosaConfig) ->
  bowerJSONPath = path.join mimosaConfig.root, "bower.json"
  require bowerJSONPath

_lastInstallBowerJSONPath = (mimosaConfig) ->
  path.join mimosaConfig.root, '.mimosa', 'bower.lastinstall.json'

_lastMimosaConfigJSONPath = (mimosaConfig) ->
  path.join mimosaConfig.root, '.mimosa', 'bower.lastmimosaconfig.json'

_isEqual = (obj1, obj2) ->
  JSON.stringify(obj1) is JSON.stringify(obj2)

exports.track = (mimosaConfig) ->
  bowerConfigOutPath = _lastMimosaConfigJSONPath mimosaConfig

  currentBowerConfig = _.cloneDeep(mimosaConfig.bower)
  currentBowerConfig.bowerDir.pathFull = ""
  _writeJSON currentBowerConfig, bowerConfigOutPath

  bowerJSON = _readBowerJSON mimosaConfig
  bowerJSONOutPath = _lastInstallBowerJSONPath mimosaConfig
  _writeJSON bowerJSON, bowerJSONOutPath

exports.isInstallNeeded = (mimosaConfig) ->
  try
    oldBowerJSON = require _lastInstallBowerJSONPath(mimosaConfig)
    logger.debug "Found old bower json"
  catch err
    logger.debug "Could not find old bower json, install needed", err
    return true

  try
    oldBowerConfig = require _lastMimosaConfigJSONPath(mimosaConfig)
    logger.debug "Found old bower config"
  catch err
    logger.debug "Could not find old bower config, install needed", err
    return true

  currentBowerConfig = _.cloneDeep(mimosaConfig.bower)
  currentBowerConfig.bowerDir.pathFull = ''
  currentBowerJSON = _readBowerJSON mimosaConfig

  if _isEqual(currentBowerConfig, oldBowerConfig) and _isEqual(currentBowerJSON, oldBowerJSON)
    logger.debug "Old bower config matches current, and older bower.json matches current"
    false
  else
    true





