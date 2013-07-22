"use strict"

path = require 'path'
fs = require 'fs'

bower = require "bower-canary"
wrench = require "wrench"
logger = require "logmimosa"

clean = require "./clean"
utils = require "./utils"

_install = (mimosaConfig, cb) ->
  bower.config.directory = mimosaConfig.bower.bowerDir.path
  installs = []
  bower.commands.install()
    .on('log', (log) ->
      if log.level is "action" and log.id is "install"
        if logger.isDebug
          logger.debug "Installed the following into #{mimosaConfig.bower.bowerDir.path}: " + log.data.pkgMeta.name
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
  try
    require path.join mimosaConfig.root, "bower.json"
    logger.debug "bower.json exists"
    true
  catch err
    logger.error "Unable to import bower packages: error reading bower.json file, ", err
    false

_makeDirectory = (folder) ->
  unless fs.existsSync folder
    logger.debug "Making folder [[ #{folder} ]]"
    wrench.mkdirSyncRecursive folder, 0o0777

_moveInstalledLibs = (copyConfigs) ->
  for copyConfig in copyConfigs
    logger.debug "Going to create file [[ #{copyConfig.out} ]]"
    _makeDirectory path.dirname(copyConfig.out)
    fileText = fs.readFileSync copyConfig.in, "utf8"
    fs.writeFileSync copyConfig.out, fileText
    logger.info "mimosa-bower created file [[ #{copyConfig.out} ]]"

exports.bowerInstall = (mimosaConfig, options, next) ->
  if _ensureBowerConfig mimosaConfig
    _makeDirectory mimosaConfig.bower.bowerDir.path
    _install mimosaConfig, (installs) ->
      if installs.length > 0
        logger.debug "There were a total of [[ #{installs.length} ]] bower packages installed"
        if mimosaConfig.bower.copy.enabled
          installedNames = installs.map (install) -> install.data.pkgMeta.name
          return utils.gatherPathConfigs mimosaConfig, installedNames, (copyConfigs) ->
            if logger.isDebug
              logger.debug "Going to move the following copyConfigurations"
              logger.debug JSON.stringify copyConfigs, null, 2

            _moveInstalledLibs copyConfigs
            clean.cleanTempDir mimosaConfig
            next()
      else
        logger.info "No bower packages to install."
        next()
  else
    next()