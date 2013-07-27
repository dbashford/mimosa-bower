"use strict"

logger = require "logmimosa"

config = require './config'
clean = require './clean'
install = require './install'

registration = (mimosaConfig, register) ->
  register ['preBuild'], 'init', install.bowerInstall

_debug = (opts) ->
  if opts.debug
    logger.setDebug()
    process.env.DEBUG = true

_prepBowerInstall = (retrieveConfig, opts) ->
  _debug opts
  retrieveConfig false, (mimosaConfig) ->
    install.bowerInstall mimosaConfig, {}, ->
      logger.success "Bower install complete."

_prepBowerClean = (retrieveConfig, opts) ->
  _debug opts
  retrieveConfig false, (mimosaConfig) ->
    clean.bowerClean mimosaConfig

registerCommand = (program, retrieveConfig) ->
  program
    .command('bower')
    .option("-D, --debug", "run in debug mode")
    .description("Run bower install")
    .action (opts) ->
      _prepBowerInstall retrieveConfig, opts

  program
    .command('bower:install')
    .option("-D, --debug", "run in debug mode")
    .description("Run bower install")
    .action (opts) ->
      _prepBowerInstall retrieveConfig, opts

  program
    .command('bower:clean')
    .option("-D, --debug", "run in debug mode")
    .description("Removes all discoverable installed bower modules from source code and removes temp directory.")
    .action (opts) ->
      _prepBowerClean retrieveConfig, opts

module.exports =
  registration:    registration
  registerCommand: registerCommand
  defaults:        config.defaults
  placeholder:     config.placeholder
  validate:        config.validate