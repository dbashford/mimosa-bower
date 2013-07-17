"use strict";
var path;

path = require("path");

exports.defaults = function() {
  return {
    bower: {
      bowerDir: {
        path: ".mimosa/bower_components",
        clean: false
      },
      copy: {
        enabled: true,
        vendorRoot: false,
        exclude: [],
        mainOverrides: {}
      }
    }
  };
};

exports.placeholder = function() {
  return "\t\n\n  # bower:                  # Configuration for bower module\n    # bowerDir:\n      # path: \".mimosa/bower_components\"  # The location mimosa-bower places temporary bower\n                                          # assets.\n      # clean: false              # whether or not to remove temporary bower assets after install\n                                  # If enabled, mimosa-bower will not auto-install bower\n                                  # dependencies when mimosa starts as that would cause mimosa to\n                                  # install everything every time. If clean is enabled, the\n                                  # \"bower\" command must be used to install dependencies.\n\n    # copy:                       # configuration for the copying of assets from bower temp\n                                  # directories into the project\n      # enabled: true             # whether or not to copy the assets out of the bowerDir.path\n                                  # into the project vendor location\n      # vendorRoot: false         # when set to true assets will be copied directly to root of\n                                  # the vendor directory. By default they will be copied to a\n                                  # directory inside the vendorRoot named for the bower package.\n                                  # Ex: vendor/backbone.js vs vendor/backbone/backbone.js\n      # exclude:[]                # An array of string paths or regexes. Files to exclude from\n                                  # copying. Paths should be relative to the bowerdir.path or\n                                  # absolute.\n\n      # mainOverrides: {}         # Occasionally bower packages do not clearly indicate what file\n                                  # is the main library file. In those cases, mimosa cannot find\n                                  # the main files in order to copy them to the vendor directory.\n                                  # json2 is a good example. This setting allows for setting\n                                  # which files should be copied for a package. The key for this\n                                  # object is the name of the package. The value is an array of\n                                  # path strings representing the package's main files. The paths\n                                  # should be relative to the root of the package. For example:\n                                  # {\"json2\":[\"json2.js\",\"json_parse.js\"]}\n";
};

exports.validate = function(config, validators) {
  var b, errors, o;
  errors = [];
  if (validators.ifExistsIsObject(errors, "bower config", config.bower)) {
    b = config.bower;
    if (validators.ifExistsIsObject(errors, "bower.bowerDir", b.bowerDir)) {
      if (validators.ifExistsIsString(errors, "bower.bowerDir.path", b.bowerDir.path)) {
        b.bowerDir.pathFull = path.join(config.root, b.bowerDir.path);
      }
      validators.ifExistsIsBoolean(errors, "bower.outputFolder.clean", b.bowerDir.clean);
    }
    if (validators.ifExistsIsObject(errors, "bower.copy", b.copy)) {
      validators.ifExistsIsBoolean(errors, "bower.copy.enabled", b.copy.enabled);
      validators.ifExistsIsBoolean(errors, "bower.copy.vendorRoot", b.copy.vendorRoot);
      validators.ifExistsFileExcludeWithRegexAndString(errors, "bower.copy.exclude", b.copy, b.bowerDir.pathFull);
      if (validators.ifExistsIsObject(errors, "bower.copy.mainOverrides", b.copy.mainOverrides)) {
        o = b.copy.mainOverrides;
        Object.keys(o).forEach(function(key) {
          return validators.isArrayOfStrings(errors, "bower.copy.mainOverrides values", o[key]);
        });
      }
    }
  }
  return errors;
};
