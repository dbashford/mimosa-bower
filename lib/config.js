"use strict";
var logger, path, strategyVal, _;

path = require("path");

_ = require("lodash");

logger = require("logmimosa");

exports.defaults = function() {
  return {
    bower: {
      bowerDir: {
        path: ".mimosa/bower/bower_components",
        clean: true
      },
      copy: {
        enabled: true,
        trackChanges: true,
        outRoot: null,
        defaultStrategy: "packageRoot",
        strategy: "packageRoot",
        forceLatest: true,
        exclude: [],
        overridesArrays: {},
        overridesObjects: {},
        mainOverrides: {},
        pathMod: []
      }
    }
  };
};

exports.placeholder = function() {
  return "\t\n\n  # bower:                  # Configuration for bower module\n    # bowerDir:\n      # path: \".mimosa/bower/bower_components\"  # The location mimosa-bower places temporary\n                                                # bower assets.\n      # clean: true              # whether or not to remove temporary bower assets after install\n\n    # copy:                       # configuration for the copying of assets from bower temp\n                                  # directories into the project\n      # enabled: true             # whether or not to copy the assets out of the bowerDir.path\n                                  # into the project vendor location\n      # trackChanges: true        # When set to true, mimosa-bower will keep track of your\n                                  # bower.json and mimosa-config \"bower\" configuration and kick\n                                  # off installs based on changes. When set to false, bower's\n                                  # default checking is used. This is based on the contents of\n                                  # bowerDir.path. If bowerDir.clean is true, and trackChanges is\n                                  # false, mimosa-bower will not perform installs during \"watch\"\n                                  # and \"build\" because installs would occur every time mimosa\n                                  # starts up.\n      # outRoot: null             # A string path to append to the vendor directory before\n                                  # copying in assets.  All copied assets would go inside this\n                                  # directory. Example: \"bower-managed\". null means no outRoot\n                                  # is applied.\n      # exclude:[]                # An array of string paths or regexes. Files to exclude from\n                                  # copying. Paths should be relative to the bowerdir.path or\n                                  # absolute.\n      # mainOverrides: {}         # Occasionally bower packages do not clearly indicate what file\n                                  # is the main library file. In those cases, mimosa cannot find\n                                  # the main files to copy them to the vendor directory. json2 is\n                                  # a good example. mainOverrides allows for setting which files\n                                  # should be copied for a package. The key for this object is\n                                  # the name of the package. The value is an array of path\n                                  # strings representing the package's main files. The paths\n                                  # should be relative to the root of the package. For example:\n                                  # {\"json2\":[\"json2.js\",\"json_parse.js\"]}. The paths can also\n                                  # be to directories. That will include all the directory's\n                                  # files. mainOverrides packages can also be provided an object\n                                  # in addition to string paths. The object maps input paths to\n                                  # output paths and allow for specific placement of files and\n                                  # folders. Ex {\"json2\":{\"json2.js\":\"json-utils/json2.js\"}. In\n                                  # this case the \"json2.js\" file will be placed in\n                                  # \"json-utils/json2.js\" in the vendor.javascripts folder.\n      # strategy: \"packageRoot\"   # The copying strategy. \"vendorRoot\" places all files at the\n                                  # root of the vendor directory. \"packageRoot\" places the files\n                                  # in the vendor directory in a folder named for that package.\n                                  # \"none\" will copy the assets into the vendor directory without\n                                  # modification.  strategy can also be an object with keys that\n                                  # match the names of packages and values of strategy types.\n                                  # When using a strategy object, the key of \"*\" provides a\n                                  # default strategy. If only 2 of 10 packages are specified\n                                  # the rest get the \"*\" strategy. If no \"*\" is provided,\n                                  # \"packageRoot\" is the assumed default.\n      # forceLatest: true         # If you are running into a problem where dependency versions\n                                  # are clashing, use forceLatest to make it so the latest\n                                  # version is loaded.  For instance, you might have jquery 2.0.0\n                                  # as a package, but something else depends on 1.8.1.\n      # pathMod: []               # pathMod can be an array of strings or a regex. It is used to\n                                  # strip full pieces of a path from the output file when the\n                                  # selected strategy is \"none\". If a bower package script is in\n                                  # \"packageName/lib/js/foo.js\" and \"pathMod\" is set to\n                                  # ['js', 'lib'] the output path would have \"lib\" and \"js\"\n                                  # stripped. Feel free to suggest additions to this based on\n                                  # your experience!\n";
};

strategyVal = function(errors, strat) {
  if (["none", "vendorRoot", "packageRoot"].indexOf(strat) === -1) {
    errors.push('Invalid bower.copy.strategy used. Must be "none", "vendorRoot" or "packageRoot".');
    return false;
  } else {
    return true;
  }
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
      validators.ifExistsIsBoolean(errors, "bower.copy.trackChanges", b.copy.trackChanges);
      validators.ifExistsIsBoolean(errors, "bower.copy.forceLatest", b.copy.forceLatest);
      if (b.copy.outRoot === null) {
        b.copy.outRoot = '';
      } else if (typeof b.copy.outRoot !== "string") {
        errors.push("bower.copy.outRoot must be a string or null.");
      }
      if (typeof b.copy.strategy === "string") {
        if (strategyVal(errors, b.copy.strategy)) {
          b.copy.defaultStrategy = b.copy.strategy;
          b.copy.strategy = {};
        }
      } else if (typeof b.copy.strategy === "object" && !Array.isArray(b.copy.strategy)) {
        Object.keys(b.copy.strategy).forEach(function(key) {
          if (!(typeof key === "string" && typeof b.copy.strategy[key] === "string")) {
            return errors.push("bower.copy.strategy object must have a string key and a string value.");
          } else {
            return strategyVal(errors, b.copy.strategy[key]);
          }
        });
        if (errors.length === 0) {
          if (b.copy.strategy["*"]) {
            b.copy.defaultStrategy = b.copy.strategy["*"];
          }
        }
      } else {
        errors.push("bower.copy.strategy must be a string or an object");
      }
      validators.ifExistsFileExcludeWithRegexAndString(errors, "bower.copy.exclude", b.copy, b.bowerDir.pathFull);
      if (validators.ifExistsIsObject(errors, "bower.copy.mainOverrides", b.copy.mainOverrides)) {
        o = b.copy.mainOverrides;
        Object.keys(o).forEach(function(pack) {
          var overrides;
          overrides = o[pack];
          if (validators.isArray(errors, "bower.copy.mainOverrides values", overrides)) {
            return overrides.forEach(function(override) {
              if (typeof override === "string") {
                if (!b.copy.overridesArrays[pack]) {
                  b.copy.overridesArrays[pack] = [];
                }
                return b.copy.overridesArrays[pack].push(override);
              } else if (typeof override === "object" && !Array.isArray(override)) {
                if (!b.copy.overridesObjects[pack]) {
                  b.copy.overridesObjects[pack] = {};
                }
                return Object.keys(override).forEach(function(oKey) {
                  if (typeof oKey === "string" && typeof override[oKey] === "string") {
                    return b.copy.overridesObjects[pack] = _.extend(b.copy.overridesObjects[pack], override);
                  } else {
                    return errors.push("Objects provided to bower.copy.mainOverrides package array must have keys and values of strings");
                  }
                });
              } else {
                return errors.push("Items provided as bower.copy.mainOverrides entries must be objects or strings");
              }
            });
          }
        });
      }
      if (b.copy.pathMod != null) {
        if (Array.isArray(b.copy.pathMod)) {
          if (b.copy.pathMod.length === 0) {
            b.copy.pathMod = null;
          } else {
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
