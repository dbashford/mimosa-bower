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
  error = false
  installs = []
  bower.commands.install()
    .on('log', (log) ->
      if log.level is "action" and log.id is "install"
        installs.push log
    ).on('error', (message) ->
      logMessage = if message.code is "ECONFLICT"
        _versionConflictMessage message
      logger.error(logMessage ? message)
      error = true
    ).on('end', -> cb error, installs)

_versionConflictMessage = (data) ->
  pickVersions = data.picks.map((pick) -> "#{pick.pkgMeta.name}@#{pick.pkgMeta.version}").join(", ")
  "#{data}: #{pickVersions}"

_ensureBowerConfig = (mimosaConfig) ->
  try
    require path.join mimosaConfig.root, "bower.json"
    true
  catch err
    logger.error "Error reading bower.json file: ", err
    false

_ensureDirectory = (mimosaConfig, options, next) ->
  folder = mimosaConfig.bower.bowerDir.path
  unless fs.existsSync folder
    wrench.mkdirSyncRecursive folder, 0o0777
  next() if next

_moveInstalledLibs = (copyConfigs) ->
  for copyConfig in copyConfigs
    outDirectory = path.dirname(copyConfig.out)
    unless fs.existsSync outDirectory
      wrench.mkdirSyncRecursive outDirectory, 0o0777

    fileText = fs.readFileSync copyConfig.in, "utf8"
    fs.writeFileSync copyConfig.out, fileText
    logger.info "mimosa-bower created file [[ #{copyConfig.out} ]]"

exports.bowerInstall = (mimosaConfig, options, next) ->
  if _ensureBowerConfig mimosaConfig
    _ensureDirectory mimosaConfig
    _install mimosaConfig, (error, installs) ->
      if error
        logger.error "Aborting Bower processing due to error."
      else
        if installs.length > 0
          if mimosaConfig.bower.copy.enabled
            installedNames = installs.map (install) -> install.data.pkgMeta.name
            return utils.gatherPathConfigs mimosaConfig, installedNames, (copyConfigs) ->
              _moveInstalledLibs copyConfigs
              clean.cleanTempDir mimosaConfig
              next()

      next()