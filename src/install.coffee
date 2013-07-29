"use strict"

path = require 'path'
fs = require 'fs'

bower = require "bower"
wrench = require "wrench"
logger = require "logmimosa"

clean = require "./clean"
utils = require "./utils"
track = require "./track"

_install = (mimosaConfig, cb) ->
  bower.config.directory = mimosaConfig.bower.bowerDir.path
  installs = []
  logger.info "Starting Bower install..."
  bower.commands.install()
    .on('log', (log) ->
      if log.level is "action" and log.id is "install"
        if logger.isDebug
          logger.debug "Installed the following into #{mimosaConfig.bower.bowerDir.path}: " + log.data.endpoint.name
        installs.push log
    ).on('error', (message) ->
      _logInstallErrorMessage message
    ).on('end', -> cb installs)

_logInstallErrorMessage = (message) ->
  logMessage = if message.code is "ECONFLICT"
    pickVersions = message.picks.map((pick) -> "#{pick.pkgMeta.name}@#{pick.pkgMeta.version}").join(", ")
    "#{message}: #{pickVersions}"
  else if message.code is "EINVALID"
    "#{message}: #{message.details}"
  else
    message

  logger.error logMessage

_ensureBowerConfig = (mimosaConfig) ->
  bowerJsonPath = path.join mimosaConfig.root, "bower.json"
  try
    require bowerJsonPath
    logger.debug "bower.json exists"
    true
  catch err
    logger.error "Error reading Bower config file [[ #{bowerJsonPath} ]]", err
    false

_moveInstalledLibs = (copyConfigs) ->
  installedFiles = []
  for copyConfig in copyConfigs
    logger.debug "Going to create file [[ #{copyConfig.out} ]]"
    for outFile in copyConfig.out
      utils.makeDirectory path.dirname outFile
      fileText = fs.readFileSync copyConfig.in, "utf8"
      fs.writeFileSync outFile, fileText
      installedFiles.push outFile
      logger.info "mimosa-bower created file [[ #{outFile} ]]"

  installedFiles

exports.bowerInstall = (mimosaConfig, options, next) ->
  hasBowerConfig = _ensureBowerConfig mimosaConfig
  unless hasBowerConfig
    next() if next
    return

  if mimosaConfig.bower.copy.trackChanges
    unless track.isInstallNeeded mimosaConfig
      logger.info "No Bower installs needed."
      next() if next
      return

  utils.makeDirectory mimosaConfig.bower.bowerDir.path
  _install mimosaConfig, (installs) ->
    if installs.length > 0
      logger.debug "There were a total of [[ #{installs.length} ]] bower packages installed"
      if mimosaConfig.bower.copy.enabled
        installedNames = installs.map (install) -> install.data.endpoint.name
        return utils.gatherPathConfigs mimosaConfig, installedNames, (copyConfigs) ->
          if logger.isDebug
            logger.debug "Going to move the following copyConfigurations"
            logger.debug JSON.stringify copyConfigs, null, 2

          installFiles = _moveInstalledLibs copyConfigs
          clean.cleanTempDir mimosaConfig

          if mimosaConfig.bower.copy.trackChanges
            track.track mimosaConfig, installFiles

          next() if next
    else
      logger.info "No bower packages to install."
      next() if next
