"use strict"

path = require 'path'

_ = require 'lodash'

transforms = {}

# The copying strategy. "vendorRoot" places all files at the
# root of the vendor directory. "packageRoot" places the files
# in the vendor directory in a folder named for that package.
# "packageShorten" is the same as "packageRoot", except it
# attempts to shorten any common folder names. If all package
# files are inside a "js" directory inside the package, this
# option removes that common js directory. "none" will copy
# the assets into the vendor directory without modification.

_isCSS = (filePath) ->
  (/.css$/).test filePath

_isJavaScript = (filePath) ->
  (/.js$/).test filePath

_replacePathPieces = (mimosaConfig, aPath) ->
  unless mimosaConfig.bower.copy.pathMod
    return aPath

  packagePath = aPath.replace mimosaConfig.bower.bowerDir.pathFull, ""
  packagePathOutPieces = []
  for piece in packagePath.split path.sep
    unless mimosaConfig.bower.copy.pathMod.test piece
      packagePathOutPieces.push piece

  path.join mimosaConfig.bower.bowerDir.pathFull, packagePathOutPieces.join(path.sep)

transforms.vendorRoot = (mimosaConfig, resolvedPaths) ->
  console.log "VENDOR ROOT"

transforms.packageRoot = (mimosaConfig, resolvedPaths) ->
  console.log "PACKAGE ROOT"

transforms.packageShorten = (mimosaConfig, resolvedPaths) ->
  console.log "PACKAGE SHORTEN"

transforms.none = (mimosaConfig, resolvedPaths) ->
  copyFileConfigs = []

  for lib, paths of resolvedPaths
    for inPath in paths
      modInPath = _replacePathPieces mimosaConfig, inPath
      outPath = if _isJavaScript modInPath
        modInPath.replace mimosaConfig.bower.bowerDir.pathFull, mimosaConfig.vendor.javascripts
      else
        modInPath.replace mimosaConfig.bower.bowerDir.pathFull, mimosaConfig.vendor.stylesheets

      copyFileConfigs.push {in:inPath, out:outPath}

  copyFileConfigs

module.exports = (mimosaConfig, resolvedPaths) ->
  transforms[mimosaConfig.bower.copy.strategy](mimosaConfig, resolvedPaths)

