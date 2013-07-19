"use strict"

fs = require 'fs'
path = require 'path'

_ = require 'lodash'
bower = require "bower-canary"
wrench = require "wrench"
logger = require "logmimosa"

utils = require './utils'

_cleanInstalledLibs = (copyConfigs) ->
  for copyConfig in copyConfigs
    try
      fs.unlinkSync copyConfig.out
      logger.info "Removed file [[ #{copyConfig.out} ]]"
    catch err
      logger.warn "Unable to clean file [[ #{copyConfig.out} ]], was it moved from this location?"

_removeDirs = (dirs) ->
  for dir in dirs
    try
      fs.rmdirSync dir
      logger.info "Cleaned up empty bower package directory [[ #{dir} ]]"
    catch err
      unless err.code is 'ENOTEMPTY'
        logger.error "Unable to delete directory, [[ #{dirPath} ]] :", err

exports.cleanTempDir = cleanTempDir = (mimosaConfig, force) ->
  if (force or mimosaConfig.bower.bowerDir.clean) and fs.existsSync mimosaConfig.bower.bowerDir.pathFull
    wrench.rmdirSyncRecursive mimosaConfig.bower.bowerDir.pathFull
    logger.info "Cleaned temp bower output directory [[ #{mimosaConfig.bower.bowerDir.pathFull} ]]"

_cleanEmptyDirs = (mimosaConfig, packages) ->
  jsDirs =  wrench.readdirSyncRecursive(mimosaConfig.vendor.javascripts).map (dir) -> path.join mimosaConfig.vendor.javascripts, dir
  cssDirs = wrench.readdirSyncRecursive(mimosaConfig.vendor.stylesheets).map (dir) -> path.join mimosaConfig.vendor.stylesheets, dir
  allDirs = _.uniq(jsDirs.concat(cssDirs))
  # eliminate any directories that do not have one of the bower package names in its path
  allDirs = allDirs.filter (dir) ->
    _.intersection(dir.split(path.sep), packages).length > 0
  allDirs = _.sortBy(allDirs, (dir) -> dir.length).reverse()
  _removeDirs allDirs

exports.bowerClean = (mimosaConfig) ->
  bower.config.directory = mimosaConfig.bower.bowerDir.path
  bower.commands.list({paths: true}).on 'end', (paths) ->
    packages = Object.keys paths
    utils.gatherPathConfigs mimosaConfig, packages, (copyConfigs) ->
      _cleanInstalledLibs copyConfigs
      cleanTempDir mimosaConfig, true
      unless mimosaConfig.bower.copy.strategy is "vendorRoot"
        _cleanEmptyDirs mimosaConfig, packages
      logger.success "Bower artifacts cleaned up."