"use strict"

path = require 'path'
fs = require 'fs'

utils = require "./utils"
track = require "./track"

logger = null
bower = null

_install = (mimosaConfig, _installOptions, cb) ->
  bower.config.directory = mimosaConfig.bower.bowerDir.path
  installs = []

  names = undefined
  installOpts =
    forceLatest: mimosaConfig.bower.copy.forceLatest

  if _installOptions
    installOpts.save = _installOptions.save
    installOpts.saveDev = _installOptions.saveDev
    names = _installOptions.names
  else
    installOpts.save = true

  logger.info "Starting Bower install..."
  bower.commands.install(names, installOpts)
    .on('log', (log) ->
      if log.level is "action" and log.id is "install"
        if logger.isDebug()
          logger.debug "Installed the following into [[ #{mimosaConfig.bower.bowerDir.path} ]]: " + log.data.endpoint.name
        installs.push log
      else if log.level is 'conflict' and log.id is 'solved' and log.data.forced
        _logForcedMessage log
    ).on('error', (message) ->
      _logInstallErrorMessage message
      cb []
    ).on('end', -> cb installs)

_logForcedMessage = (log) ->
  picks = log.data.picks.map (pick) ->
    pick.pkgMeta.name + "@" + pick.pkgMeta.version
  suitMeta = log.data.suitable.pkgMeta
  logger.warn "mimosa-bower used forceLatest and picked [[ #{suitMeta.name}@#{suitMeta.version} ]] from [[ #{picks.join(', ')} ]]"

_logInstallErrorMessage = (message) ->
  logMessage = if message.code is "ECONFLICT"
    pickVersions = message.picks.map((pick) -> "#{pick.pkgMeta.name}@#{pick.pkgMeta.version}").join(", ")
    "#{message}: #{pickVersions}"
  else if message.code is "EINVALID"
    "#{message}: #{message.details}"
  else if message.code is "ENOGIT"
    "Mimosa is trying to use Bower which depends on having git installed, but Bower cannot find git. " +
    "If you do not wish to install git or use Bower, you can remove \"bower\" from the list of modules " +
    "in the mimosa-config."
  else
    message

  logger.error logMessage

_moveInstalledLibs = (copyConfigs) ->
  installedFiles = []
  for copyConfig in copyConfigs
    logger.debug "Going to create file [[ #{copyConfig.out} ]]"
    for outFile in copyConfig.out
      utils.makeDirectory path.dirname outFile
      fileBuffer = fs.readFileSync copyConfig.in
      fs.writeFileSync outFile, fileBuffer
      installedFiles.push outFile
      logger.info "mimosa-bower created file [[ #{outFile} ]]"

  installedFiles

_postInstall = (mimosaConfig, isSingleLibraryInstall, next) ->
  utils.makeDirectory mimosaConfig.bower.bowerDir.path
  (installs) ->
    if installs.length > 0
      logger.debug "There were a total of [[ #{installs.length} ]] bower packages installed"
      if mimosaConfig.bower.copy.enabled
        installedNames = installs.map (install) -> install.data.endpoint.name
        return utils.gatherPathConfigs mimosaConfig, installedNames, (copyConfigs) ->
          if logger.isDebug()
            logger.debug "Going to move the following copyConfigurations"
            logger.debug JSON.stringify copyConfigs, null, 2

          installFiles = _moveInstalledLibs copyConfigs
          clean = require "./clean"
          clean.cleanTempDir mimosaConfig

          if mimosaConfig.bower.copy.trackChanges
            track.track mimosaConfig, installFiles, isSingleLibraryInstall

          next() if next
      else
        next() if next
    else
      logger.info "No bower packages were installed."
      next() if next

exports.installLibrary = (mimosaConfig, opts) ->
  unless logger
    logger = mimosaConfig.log

  unless bower
    bower = require "bower"

  hasBowerConfig = utils.ensureBowerConfig(mimosaConfig)
  libraryOptions =
    names: opts.names
    save: hasBowerConfig and not opts.savedev
    saveDev: hasBowerConfig and opts.savedev

  _install mimosaConfig, libraryOptions, _postInstall(mimosaConfig, true)

exports.bowerInstall = (mimosaConfig, options, next) ->
  unless logger
    logger = mimosaConfig.log

  unless bower
    bower = require "bower"

  hasBowerConfig = utils.ensureBowerConfig mimosaConfig
  unless hasBowerConfig
    next() if next
    return

  if mimosaConfig.bower.copy.trackChanges
    unless track.isInstallNeeded mimosaConfig
      logger.info "No Bower installs needed."
      next() if next
      return

  _install mimosaConfig, undefined, _postInstall(mimosaConfig, false, next)