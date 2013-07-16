"use strict"

fs = require 'fs'
path = require 'path'

logger = require "logmimosa"
wrench = require "wrench"
bower = require "bower"

config = require './config'

registration = (mimosaConfig, register) ->
  ###
  e = mimosaConfig.extensions
  register ['add','update','buildFile'],      'afterCompile', _minifyJS, e.javascript
  register ['add','update','buildExtension'], 'beforeWrite',  _minifyJS, e.template
  ###

_bowerInstall = (mimosaConfig, options, next) ->
  if _ensureBowerConfig mimosaConfig
    _ensureDirectory mimosaConfig
    _install mimosaConfig, (error) ->
      if error
        console.error "Aborting Bower processing due to error."
        next() if next()
      else
        _move mimosaConfig, ->
          _clean mimosaConfig, ->
            logger.success "Bower assets installed."

_ensureBowerConfig = (mimosaConfig) ->
  try
    require path.join mimosaConfig.root, "bower.json"
    true
  catch err
    logger.error "Error reading bower.json file: ", err
    false

_ensureDirectory = (mimosaConfig, options, next) ->
  folder = mimosaConfig.bower.outputDir.path
  unless fs.existsSync folder
    wrench.mkdirSyncRecursive folder, 0o0777
  next() if next

_install = (mimosaConfig, cb) ->
  bower.config.directory = mimosaConfig.bower.outputDir.path
  error = false
  bower.commands.install()
    .on('data', logger.info)
    .on('error', (message) ->
      logger.error message
      error = true
    ).on('end', -> cb error)

_move = (mimosaConfig, cb) ->
  cb()

_clean = (mimosaConfig, cb) ->
  if mimosaConfig.bower.outputDir.clean
    wrench.rmdirSyncRecursive mimosaConfig.bower.outputDir.pathFull
    logger.info "Cleaned temp bower output directory [[ #{mimosaConfig.bower.outputDir.pathFull} ]]"
  cb()

registerCommand = (program, retrieveConfig) ->
  program
    .command('bower')
    .description("Run bower install")
    .action ->
      retrieveConfig false, (mimosaConfig) ->
        _bowerInstall mimosaConfig

module.exports =
  registration:    registration
  registerCommand: registerCommand
  defaults:        config.defaults
  placeholder:     config.placeholder
  validate:        config.validate