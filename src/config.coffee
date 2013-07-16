"use strict"

path = require "path"

exports.defaults = ->
  bower:
    outputDir:
      path: ".mimosa/bower_components"
      clean: true

exports.placeholder = ->
  """
  \t

    # bower:                  # Configuration for bower module
      # outputDir:
        # path: ".mimosa/bower_components"  # The location mimosa-bower places temporary bower
                                            # assets.
        # clean: true                       # whether or not to remove temporary bower assets
                                            # after install
  """

exports.validate = (config, validators) ->
  errors = []

  if validators.ifExistsIsObject(errors, "bower config", config.bower)
    if validators.ifExistsIsObject(errors, "bower.outputDir", config.bower.outputDir)
      if validators.ifExistsIsString(errors, "bower.outputDir.path", config.bower.outputDir.path)
        config.bower.outputDir.pathFull = path.join config.root, config.bower.outputDir.path
      validators.ifExistsIsBoolean(errors, "bower.outputFolder.clean", config.bower.outputDir.clean)

  errors
