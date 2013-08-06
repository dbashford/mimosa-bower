"use strict"

logger = require "logmimosa"

config = require './config'
clean = require './clean'
install = require './install'

registration = (mimosaConfig, register) ->
  # unless there is no means to determine if installs need to happen...
  unless mimosaConfig.bower.copy.trackChanges is false and mimosaConfig.bower.copy.clean is true
    register ['preBuild'], 'init', install.bowerInstall

_debug = (opts) ->
  if opts.debug
    logger.setDebug()
    process.env.DEBUG = true

_callIfModuleIncluded = (mimosaConfig, opts, cb) ->

  ms = mimosaConfig.modules
  if ms.indexOf("bower") > -1 or ms.indexOf("mimosa-bower") > -1
    cb mimosaConfig, opts
  else
    logger.error """
      You have called the bower command on a project that does not have bower included.
      To include bower, add "bower" to the "modules" array.
      """

_prepBowerInstall = (retrieveConfig, opts) ->
  _debug opts
  retrieveConfig false, (mimosaConfig) ->
    _callIfModuleIncluded mimosaConfig, opts, install.bowerInstall

_prepBowerClean = (retrieveConfig, opts) ->
  _debug opts
  retrieveConfig false, (mimosaConfig) ->
    _callIfModuleIncluded mimosaConfig, opts, clean.bowerClean

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
    .option("-c, --cache", "also clean the cache")
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