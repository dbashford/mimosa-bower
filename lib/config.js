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
        strategy: "packageRoot",
        exclude: [],
        mainOverrides: {},
        pathMod: ["js", "javascript", "javascripts", "css", "stylesheet", "stylesheets", "vendor", "lib"]
      }
    }
  };
};

exports.placeholder = function() {
  return "\t\n\n  # bower:                  # Configuration for bower module\n    # bowerDir:\n      # path: \".mimosa/bower_components\"  # The location mimosa-bower places temporary bower\n                                          # assets.\n      # clean: false              # whether or not to remove temporary bower assets after install\n                                  # If enabled, mimosa-bower will not auto-install bower\n                                  # dependencies when mimosa starts as that would cause mimosa to\n                                  # install everything every time. If clean is enabled, the\n                                  # \"bower\" command must be used to install dependencies.\n\n    # copy:                       # configuration for the copying of assets from bower temp\n                                  # directories into the project\n      # enabled: true             # whether or not to copy the assets out of the bowerDir.path\n                                  # into the project vendor location\n      # exclude:[]                # An array of string paths or regexes. Files to exclude from\n                                  # copying. Paths should be relative to the bowerdir.path or\n                                  # absolute.\n      # mainOverrides: {}         # Occasionally bower packages do not clearly indicate what file\n                                  # is the main library file. In those cases, mimosa cannot find\n                                  # the main files in order to copy them to the vendor directory.\n                                  # json2 is a good example. This setting allows for setting\n                                  # which files should be copied for a package. The key for this\n                                  # object is the name of the package. The value is an array of\n                                  # path strings representing the package's main files. The paths\n                                  # should be relative to the root of the package. For example:\n                                  # {\"json2\":[\"json2.js\",\"json_parse.js\"]}\n      # strategy: \"packageRoot\"   # The copying strategy. \"vendorRoot\" places all files at the\n                                  # root of the vendor directory. \"packageRoot\" places the files\n                                  # in the vendor directory in a folder named for that package.\n                                  # \"none\" will copy the assets into the vendor directory without\n                                  # modification.\n      # pathMod: [\"js\", \"javascript\", \"javascripts\", \"css\", \"stylesheet\", \"stylesheets\", \"vendor\", \"lib\"]\n                                  # pathMod can be an array of strings or a regex. It is used to\n                                  # strip full pieces of a path from the output file when the\n                                  # selected strategy is \"none\". If a bower package script is in\n                                  # \"packageName/lib/js/foo.js\" by default the output path would\n                                  # have \"lib\" and \"js\" stripped. Feel free to suggest additions\n                                  # to this based on your experience!\n";
};

exports.validate = function(config, validators) {
  var b, errors, item, notString, o, regexArray, regexString, _i, _len, _ref;
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
      if (validators.ifExistsIsString(errors, "bower.copy.strategy", b.copy.strategy)) {
        if (["none", "vendorRoot", "packageRoot"].indexOf(b.copy.strategy) === -1) {
          errors.push('Invalid bower.copy.strategy used. Must be "none", "vendorRoot" or "packageRoot".');
        }
      }
      validators.ifExistsFileExcludeWithRegexAndString(errors, "bower.copy.exclude", b.copy, b.bowerDir.pathFull);
      if (validators.ifExistsIsObject(errors, "bower.copy.mainOverrides", b.copy.mainOverrides)) {
        o = b.copy.mainOverrides;
        Object.keys(o).forEach(function(key) {
          return validators.isArrayOfStrings(errors, "bower.copy.mainOverrides values", o[key]);
        });
      }
      if (b.copy.pathMod != null) {
        if (Array.isArray(b.copy.pathMod)) {
          notString = false;
          regexArray = [];
          _ref = b.copy.pathMod;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            item = _ref[_i];
            if (typeof item === "string") {
              regexArray.push("^" + item + "$");
            } else {
              notString = true;
              break;
            }
          }
          if (notString) {
            errors.push("bower.copy.pathMod must be a regex or an array of strings.");
          } else {
            regexString = "(" + regexArray.join("|") + ")";
            b.copy.pathMod = new RegExp(regexString);
          }
        } else {
          if (!(b.copy.pathMod instanceof RegExp)) {
            errors.push("bower.copy.pathMod must be a regex or an array of strings.");
          }
        }
      }
    }
  }
  return errors;
};
