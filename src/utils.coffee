"use strict"

fs = require 'fs'
path = require 'path'

bower = require "bower-canary"
logger = require "logmimosa"

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
  unless _isPathExcluded(mimosaConfig.bower.copy, thePath)
    pathArray.push thePath

_isPathExcluded = (copy, filePath) ->
  if copy.excludeRegex? and filePath.match copy.excludeRegex
    true
  else if copy.exclude.indexOf(filePath) > -1
    true
  else
    false

exports.gatherPathConfigs = (mimosaConfig, installedNames, cb) ->
    bower.commands.list({paths: true}).on 'end', (paths) ->
      resolvedPaths = _resolvePaths mimosaConfig, installedNames, paths
      copyConfigs = strategy mimosaConfig, resolvedPaths
      cb copyConfigs