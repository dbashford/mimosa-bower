"use strict";
var path;

path = require("path");

exports.defaults = function() {
  return {
    bower: {
      outputDir: {
        path: ".mimosa/bower_components",
        clean: true
      }
    }
  };
};

exports.placeholder = function() {
  return "\t\n\n  # bower:                  # Configuration for bower module\n    # outputDir:\n      # path: \".mimosa/bower_components\"  # The location mimosa-bower places temporary bower\n                                          # assets.\n      # clean: true                       # whether or not to remove temporary bower assets\n                                          # after install";
};

exports.validate = function(config, validators) {
  var errors;
  errors = [];
  if (validators.ifExistsIsObject(errors, "bower config", config.bower)) {
    if (validators.ifExistsIsObject(errors, "bower.outputDir", config.bower.outputDir)) {
      if (validators.ifExistsIsString(errors, "bower.outputDir.path", config.bower.outputDir.path)) {
        config.bower.outputDir.pathFull = path.join(config.root, config.bower.outputDir.path);
      }
      validators.ifExistsIsBoolean(errors, "bower.outputFolder.clean", config.bower.outputDir.clean);
    }
  }
  return errors;
};
