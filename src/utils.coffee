"use strict"

fs = require 'fs'
path = require 'path'

bower = require "bower"
logger = require "logmimosa"
wrench = require "wrench"

strategy = require './strategy'

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

_processOverridesList = (mimosaConfig, overrides, libPath, resolvedPaths, lib) ->
  if overrides? and overrides.length > 0
    overrides.forEach (override) ->
      overridePath = path.join libPath, override
      if fs.existsSync overridePath
        pathStat = fs.statSync overridePath
        if pathStat.isDirectory()
          # find everything in directory and include it
          wrench.readdirSyncRecursive(overridePath)
            .map (filePath) ->
              path.join overridePath, filePath
            .filter (filePath) ->
              fs.statSync(filePath).isFile()
            .forEach (filePath) ->
              _addResolvedPath mimosaConfig, resolvedPaths, filePath, lib
        else
          _addResolvedPath mimosaConfig, resolvedPaths, overridePath, lib
      else
        logger.info "Override path listed, but does not exist in package: [[ #{overridePath} ]]"

_resolvePaths = (mimosaConfig, names, paths) ->
  installedPaths = {}
  names.forEach (name) ->
    installedPaths[name] = paths[name].split(",")

  resolvedPaths = {}
  for lib, paths of installedPaths
    resolvedPaths[lib] = []
    fullLibPath = path.join mimosaConfig.bower.bowerDir.pathFull, lib

    if mimosaConfig.bower.copy.mainOverrides[lib]
      logger.debug "Lib [[ #{lib} ]] has overrides"
      overridesArray = mimosaConfig.bower.copy.overridesArrays[lib]
      _processOverridesList mimosaConfig, overridesArray, fullLibPath, resolvedPaths[lib]
      overridesObjectPaths = if mimosaConfig.bower.copy.overridesObjects[lib]
        Object.keys(mimosaConfig.bower.copy.overridesObjects[lib])
      _processOverridesList mimosaConfig, overridesObjectPaths, fullLibPath, resolvedPaths[lib], lib
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

_addResolvedPath = (mimosaConfig, pathArray, thePath, prependPack) ->
  unless _isPathExcluded(mimosaConfig.bower.copy, thePath)
    # if package path override, then add package as signal to transform later
    if prependPack
      thePath = "#{prependPack}!!#{thePath}"

    unless pathArray.indexOf(thePath) > -1
      pathArray.push thePath

_isPathExcluded = (copy, filePath) ->
  if copy.excludeRegex? and filePath.match copy.excludeRegex
    true
  else if copy.exclude.indexOf(filePath) > -1
    true
  else
    false

exports.ensureBowerConfig = (mimosaConfig) ->
  bowerJsonPath = path.join mimosaConfig.root, "bower.json"
  try
    require bowerJsonPath
    logger.debug "bower.json exists"
    true
  catch err
    logger.warn "Error reading Bower config file [[ #{bowerJsonPath} ]]", err
    logger.info "If you do not wish to use Bower, remove 'bower' from the mimosa-config modules array"
    false

exports.makeDirectory = (folder) ->
  unless fs.existsSync folder
    logger.debug "Making folder [[ #{folder} ]]"
    wrench.mkdirSyncRecursive folder, 0o0777

exports.gatherPathConfigs = (mimosaConfig, installedNames, cb) ->
  bower.commands.list({paths: true}).on 'end', (paths) ->
    resolvedPaths = _resolvePaths mimosaConfig, installedNames, paths
    copyConfigs = strategy mimosaConfig, resolvedPaths
    cb copyConfigs