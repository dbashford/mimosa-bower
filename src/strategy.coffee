"use strict"

path = require 'path'

_ = require 'lodash'
logger = require 'logmimosa'

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

transforms.vendorRoot = (mimosaConfig, inPath) ->
  fileName = path.basename inPath
  if _isJavaScript inPath
    path.join mimosaConfig.vendor.javascripts, mimosaConfig.bower.copy.outRoot, fileName
  else
    path.join mimosaConfig.vendor.stylesheets, mimosaConfig.bower.copy.outRoot, fileName

transforms.packageRoot = (mimosaConfig, inPath, lib) ->
  fileName = path.basename inPath
  if _isJavaScript inPath
    path.join mimosaConfig.vendor.javascripts, mimosaConfig.bower.copy.outRoot, mimosaConfig.bower.copy.outRoot,  lib, fileName
  else
    path.join mimosaConfig.vendor.stylesheets, mimosaConfig.bower.copy.outRoot,  lib, fileName

transforms.none = (mimosaConfig, inPath, lib) ->
  modInPath = _replacePathPieces mimosaConfig, inPath
  if _isJavaScript modInPath
    modInPath.replace mimosaConfig.bower.bowerDir.pathFull, path.join(mimosaConfig.vendor.javascripts, mimosaConfig.bower.copy.outRoot)
  else
    modInPath.replace mimosaConfig.bower.bowerDir.pathFull, path.join(mimosaConfig.vendor.stylesheets, mimosaConfig.bower.copy.outRoot)

transforms.custom = (mimosaConfig, lib, inPath) ->
  modInPath = _replacePathPieces mimosaConfig, inPath

  # nuke the bowerDir path
  modInPath = modInPath.replace mimosaConfig.bower.bowerDir.pathFull + path.sep, ''

  # nuke the lib root if it is there
  modInPath = modInPath.replace lib + path.sep, ''

  # retrieve override object for lib
  overrideObject = mimosaConfig.bower.copy.overridesObjects[lib]

  # the leading edge of the path should now match one of the overrides in the object
  matchedOverrides = []
  Object.keys(overrideObject).forEach (oKey) ->
    if modInPath.indexOf(oKey) is 0
      matchedOverrides.push oKey

  # found nothing, uh oh, bad config
  return if matchedOverrides.length is 0

  for matchedOverride in matchedOverrides
    # do straight path replacement at leading edge
    modPath = modInPath.replace matchedOverride, overrideObject[matchedOverride]

    # now put it all together
    if _isJavaScript modPath
      path.join path.join(mimosaConfig.vendor.javascripts, mimosaConfig.bower.copy.outRoot), modPath
    else
      path.join path.join(mimosaConfig.vendor.stylesheets, mimosaConfig.bower.copy.outRoot), modPath

determineTransform = (mimosaConfig, pack) ->
  theTransform = mimosaConfig.bower.copy.strategy[pack] ? mimosaConfig.bower.copy.defaultStrategy
  transforms[theTransform]

module.exports = (mimosaConfig, resolvedPaths) ->
  copyFileConfigs = []
  for lib, paths of resolvedPaths
    theTransform = determineTransform mimosaConfig, lib
    for inPath in paths
      if inPath.indexOf("!!") > -1
        inPathPieces = inPath.split("!!")
        outPath = transforms.custom mimosaConfig, inPathPieces[0], inPathPieces[1]
        if outPath
          copyFileConfigs.push {in:inPathPieces[1], out:outPath}
        else
          logger.warn "Could not determine output path for [[ #{inPathPieces[1]} ]]"
      else
        outPath = theTransform mimosaConfig, inPath, lib
        copyFileConfigs.push {in:inPath, out:[outPath]}

  copyFileConfigs

