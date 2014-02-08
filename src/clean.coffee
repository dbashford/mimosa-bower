"use strict"

fs = require 'fs'
path = require 'path'

_ = require 'lodash'
bower = require "bower"
wrench = require "wrench"

utils = require './utils'
track = require './track'

logger = null

_removeFile = (fileName) ->
  try
    fs.unlinkSync fileName
    logger.info "Removed file [[ #{fileName} ]]"
  catch err
    logger.warn "Unable to clean file [[ #{fileName} ]], was it moved from this location or already cleaned?"

_cleanInstalledLibs = (copyConfigs) ->
  for copyConfig in copyConfigs
    copyConfig.out.forEach _removeFile

_removeDirs = (dirs) ->
  for dir in dirs
    try
      fs.rmdirSync dir
      logger.info "Cleaned up empty bower package directory [[ #{dir} ]]"
    catch err
      unless err.code is 'ENOTEMPTY'
        logger.error "Unable to delete directory, [[ #{dir} ]] :", err

exports.cleanTempDir = cleanTempDir = (mimosaConfig, force) ->
  if (force or mimosaConfig.bower.bowerDir.clean) and fs.existsSync mimosaConfig.bower.bowerDir.pathFull
    wrench.rmdirSyncRecursive mimosaConfig.bower.bowerDir.pathFull
    mimosaConfig.log.info "Cleaned temp bower output directory [[ #{mimosaConfig.bower.bowerDir.pathFull} ]]"

_cleanEmptyDirs = (mimosaConfig, packages) ->
  jsDirs = []
  if fs.existsSync mimosaConfig.vendor.javascripts
    jsDirs = wrench.readdirSyncRecursive(mimosaConfig.vendor.javascripts).map (dir) ->
      path.join mimosaConfig.vendor.javascripts, dir

  cssDirs = []
  if fs.existsSync mimosaConfig.vendor.stylesheets
    cssDirs = wrench.readdirSyncRecursive(mimosaConfig.vendor.stylesheets).map (dir) ->
      path.join mimosaConfig.vendor.stylesheets, dir

  allDirs = _.uniq(jsDirs.concat(cssDirs))
  # eliminate any directories that do not have one of the bower package names in its path
  # or the outRoot
  if mimosaConfig.bower.copy.outRoot
    packages.push mimosaConfig.bower.copy.outRoot
  allDirs = allDirs.filter (dir) ->
    _.intersection(dir.split(path.sep), packages).length > 0
  allDirs = _.sortBy(allDirs, (dir) -> dir.length).reverse()
  _removeDirs allDirs

_cleanCache = ->
  logger.info "Cleaning Bower cache..."
  error = false
  bower.commands.cache.clean()
    .on('log', (log) ->
      #console.log log
    ).on('error', (message) ->
      logger.error "Error cleaning cache", message
      error = true
    ).on('end', -> logger.success "Bower cache cleaned." unless error)

_cleanFilesViaBower = (mimosaConfig) ->
  bower.commands.list({paths: true}).on 'end', (paths) ->
    packages = Object.keys paths
    utils.gatherPathConfigs mimosaConfig, packages, (copyConfigs) ->
      _cleanInstalledLibs copyConfigs
      cleanTempDir mimosaConfig, true
      unless mimosaConfig.bower.copy.strategy is "vendorRoot"
        _cleanEmptyDirs mimosaConfig, packages
      logger.success "Bower files cleaned."

_cleanFilesViaTrackingInfo = (mimosaConfig) ->
  installedFiles = track.getPreviousInstalledFileList mimosaConfig
  if installedFiles.length is 0
    logger.info "No files to clean."
  else
    installedFiles.map (installedFile) ->
      path.join mimosaConfig.root, installedFile
    .forEach _removeFile
  track.removeTrackFiles mimosaConfig
  logger.success "Bower files cleaned."

exports.bowerClean = (mimosaConfig, opts) ->
  logger = mimosaConfig.log

  hasBowerConfig = utils.ensureBowerConfig mimosaConfig
  unless hasBowerConfig
    return

  bower.config.directory = mimosaConfig.bower.bowerDir.path

  if opts.cache
    _cleanCache()

  if mimosaConfig.bower.copy.trackChanges is true
    _cleanFilesViaTrackingInfo mimosaConfig
  else
    _cleanFilesViaBower mimosaConfig
