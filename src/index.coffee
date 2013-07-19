"use strict"

fs = require 'fs'
path = require 'path'

logger = require "logmimosa"
wrench = require "wrench"
bower = require "bower-canary"

config = require './config'
strategy = require './strategy'

registration = (mimosaConfig, register) ->
  ###
  e = mimosaConfig.extensions
  register ['add','update','buildFile'],      'afterCompile', _minifyJS, e.javascript
  register ['add','update','buildExtension'], 'beforeWrite',  _minifyJS, e.template
  ###

_bowerInstall = (mimosaConfig, options, next) ->
  if _ensureBowerConfig mimosaConfig
    _ensureDirectory mimosaConfig
    _install mimosaConfig, (error, installs) ->
      if error
        console.error "Aborting Bower processing due to error."
      else
        if installs.length > 0
          if mimosaConfig.bower.copy.enabled
            return _move mimosaConfig, installs, ->
              _clean mimosaConfig, next
          else
            logger.success "Bower assets installed."

      next() if next

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

_handlePackageJson = (aPath) ->
  packageJsonPath = path.join aPath, "package.json"
  if fs.existsSync packageJsonPath
    try
      packageJson = require packageJsonPath
    catch err
      logger.error "Error reading package.json at [[ #{packageJsonPath} ]]"
      return {}

    details = {}
    if packageJson.main
      mainPath = path.join aPath, packageJson.main
      if fs.existsSync mainPath
        details.main = mainPath

    details.dependencies = packageJson.dependencies ? undefined

    details

_resolvePaths = (mimosaConfig, names, paths) ->
  installedPaths = {}
  names.forEach (name) ->
    installedPaths[name] = paths[name].split(",")

  resolvedPaths = {}
  for lib, paths of installedPaths
    resolvedPaths[lib] = []
    fullLibPath = path.join mimosaConfig.bower.bowerDir.pathFull, lib

    if mimosaConfig.bower.copy.mainOverrides[lib]
      mimosaConfig.bower.copy.mainOverrides[lib].forEach (override) ->
        overridePath = path.join fullLibPath, override
        if fs.existsSync overridePath
          _addResolvedPath mimosaConfig, resolvedPaths[lib], overridePath
    else
      for aPath in paths
        if fs.existsSync aPath
          pathStat = fs.statSync aPath
          if pathStat.isFile()
            _addResolvedPath mimosaConfig, resolvedPaths[lib], aPath
          else
            packageJsonDetails = _handlePackageJson aPath
            if packageJsonDetails?.main
              _addResolvedPath mimosaConfig, resolvedPaths[lib], packageJsonDetails.main

              ###
              TODO packageJsonDetails.dependencies
              ###

            else
              logger.warn "Cannot determine main file for [[ #{lib} ]] at [[ #{aPath} ]]. Consider adding a mainOverrides entry."
        else
          _addResolvedPath mimosaConfig, resolvedPaths[lib], path.join(fullLibPath, aPath)
  resolvedPaths

_addResolvedPath = (mimosaConfig, pathArray, thePath) ->
  unless _isExcluded(mimosaConfig.bower.copy, thePath)
    pathArray.push thePath

_isExcluded = (copy, filePath) ->
  if copy.excludeRegex? and filePath.match copy.excludeRegex
    true
  else if copy.exclude.indexOf(filePath) > -1
    true
  else
    false

_moveInstalledLibs = (copyConfigs) ->
  for copyConfig in copyConfigs
    outDirectory = path.dirname(copyConfig.out)
    unless fs.existsSync outDirectory
      wrench.mkdirSyncRecursive outDirectory, 0o0777

    fileText = fs.readFileSync copyConfig.in, "utf8"
    fs.writeFileSync copyConfig.out, fileText
    logger.info "mimosa-bower created file [[ #{copyConfig.out} ]]"

_move = (mimosaConfig, installs, cb) ->
  if installs.length > 0
    installedNames = installs.map (install) -> install.data.pkgMeta.name
    bower.commands.list({paths: true}).on 'end', (paths) ->
      resolvedPaths = _resolvePaths mimosaConfig, installedNames, paths
      copyConfigs = strategy mimosaConfig, resolvedPaths
      _moveInstalledLibs copyConfigs
      cb()
  else
    cb()

_clean = (mimosaConfig, next) ->
  if mimosaConfig.bower.bowerDir.clean and fs.existsSync mimosaConfig.bower.bowerDir.pathFull
    wrench.rmdirSyncRecursive mimosaConfig.bower.bowerDir.pathFull
    logger.info "Cleaned temp bower output directory [[ #{mimosaConfig.bower.bowerDir.pathFull} ]]"

  logger.success "Bower assets installed."
  next() if next

registerCommand = (program, retrieveConfig) ->
  program
    .command('bower')
    .option("-D, --debug", "run in debug mode")
    .description("Run bower install")
    .action (opts) ->
      if opts.debug
        logger.setDebug()
        process.env.DEBUG = true
      retrieveConfig false, (mimosaConfig) ->
        _bowerInstall mimosaConfig

module.exports =
  registration:    registration
  registerCommand: registerCommand
  defaults:        config.defaults
  placeholder:     config.placeholder
  validate:        config.validate