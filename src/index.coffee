"use strict"

path = require 'path'
_ = require 'lodash'
config = require './config'
track = require './track'

registration = (mimosaConfig, register) ->

  # unless there is no means to determine if installs need to happen...
  unless mimosaConfig.bower.copy.trackChanges is false and mimosaConfig.bower.copy.clean is true
    install = require './install'
    register ['preBuild'], 'init', install.bowerInstall

  if mimosaConfig.isWatch and mimosaConfig.bower.watch
    _watch mimosaConfig

_watch = (mimosaConfig) ->
  bowerJsonPath = path.join mimosaConfig.root, "bower.json"
  watcher = require "chokidar"
  watcher.watch(bowerJsonPath, {persistent: true}).on 'change', ->
    install = require './install'
    install.bowerInstall mimosaConfig

_callIfModuleIncluded = (mimosaConfig, opts, cb) ->
  bowerModule = _.find mimosaConfig.modules, (mod) ->
    mod.indexOf("bower") is 0 || mod.indexOf("mimosa-bower") is 0

  if bowerModule
    cb mimosaConfig, opts
  else
    mimosaConfig.log.error """
      You have called the bower command on a project that does not have bower included.
      To include bower, add "bower" to the "modules" array.
      """

registerCommand = (program, logger, retrieveConfig) ->

  program
    .command('bower')
    .option("-D, --mdebug", "run in debug mode")
    .description("Run bower install")
    .action (opts) ->
      retrieveConfigOpts =
        buildFirst: false
        mdebug: !!opts.mdebug
      retrieveConfig retrieveConfigOpts, (mimosaConfig) ->
        install = require './install'
        _callIfModuleIncluded mimosaConfig, opts, install.bowerInstall

  program
    .command('bower:install <names>')
    .option("-D, --mdebug", "run in debug mode")
    .option("-d, --savedev", "save to dev dependencies instead of dependencies")
    .description("Install a library and update the bower.json accordingly")
    .action (names, opts) ->
      names = names.split(',')
      opts.names = names
      retrieveConfigOpts =
        buildFirst: false
        mdebug: !!opts.mdebug
      retrieveConfig retrieveConfigOpts, (mimosaConfig) ->
        install = require './install'
        _callIfModuleIncluded mimosaConfig, opts, install.installLibrary

  program
    .command('bower:clean')
    .option("-c, --cache", "also clean the cache")
    .option("-D, --mdebug", "run in debug mode")
    .description("Removes all discoverable installed bower modules from source code and removes temp directory.")
    .action (opts) ->
      retrieveConfigOpts =
        buildFirst: false
        mdebug: !!opts.mdebug
      retrieveConfig retrieveConfigOpts, (mimosaConfig) ->
        clean = require './clean'
        _callIfModuleIncluded mimosaConfig, opts, clean.bowerClean

module.exports =
  registration:    registration
  registerCommand: registerCommand
  defaults:        config.defaults
  placeholder:     config.placeholder
  validate:        config.validate
  isInstallNeeded: track.isInstallNeeded