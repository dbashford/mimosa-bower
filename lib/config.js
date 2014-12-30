"use strict";
var path, regexRegex, strategyVal, _;

path = require("path");

_ = require("lodash");

regexRegex = /^\/.+\/$/;

exports.defaults = function() {
  return {
    bower: {
      watch: true,
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
        togetherRoot: "components",
        forceLatest: true,
        exclude: [],
        unknownMainFullCopy: false,
        overridesArrays: {},
        overridesObjects: {},
        mainOverrides: {},
        pathMod: []
      }
    }
  };
};

exports.placeholder = function() {
  return "\t\n  # visit https://github.com/dbashford/mimosa-bower for full documentation\n  # on mimosa-bower's configuration options\n  bower:\n    watch: true\n    bowerDir:\n      path: \".mimosa/bower/bower_components\"\n      clean: true\n    copy:\n      enabled: true\n      trackChanges: true\n      outRoot: null\n      exclude:[]\n      unknownMainFullCopy: false\n      mainOverrides: {}\n      strategy: \"packageRoot\"\n      togetherRoot: \"components\"\n      forceLatest: true\n      pathMod: []";
};

strategyVal = function(errors, strat, togetherRoot) {
  if (["none", "vendorRoot", "packageRoot", "together"].indexOf(strat) === -1) {
    errors.push('Invalid bower.copy.strategy used. Must be "none", "vendorRoot", "packageRoot", or "together".');
    return false;
  } else {
    if (strat === "together" && !togetherRoot) {
      errors.push('bower.copy.strategy of "together" used without a value set for "togetherRoot"');
      return false;
    } else {
      return true;
    }
  }
};

exports.validate = function(config, validators) {
  var b, errors, item, notString, o, regexArray, regexString, _i, _len, _ref;
  errors = [];
  if (validators.ifExistsIsObject(errors, "bower config", config.bower)) {
    b = config.bower;
    validators.ifExistsIsBoolean(errors, "bower.watch", b.watch);
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
      validators.ifExistsIsBoolean(errors, "bower.copy.unknownMainFullCopy", b.copy.unknownMainFullCopy);
      validators.isString(errors, "bower.copy.togetherRoot", b.copy.togetherRoot);
      if (b.copy.outRoot === null) {
        b.copy.outRoot = '';
      } else if (typeof b.copy.outRoot !== "string") {
        errors.push("bower.copy.outRoot must be a string or null.");
      }
      if (typeof b.copy.strategy === "string") {
        if (strategyVal(errors, b.copy.strategy, b.copy.togetherRoot)) {
          b.copy.defaultStrategy = b.copy.strategy;
          b.copy.strategy = {};
        }
      } else if (typeof b.copy.strategy === "object" && !Array.isArray(b.copy.strategy)) {
        Object.keys(b.copy.strategy).forEach(function(key) {
          if (!(typeof key === "string" && typeof b.copy.strategy[key] === "string")) {
            return errors.push("bower.copy.strategy object must have a string key and a string value.");
          } else {
            return strategyVal(errors, b.copy.strategy[key], b.copy.togetherRoot);
          }
        });
        if (!errors.length) {
          if (b.copy.strategy["*"]) {
            b.copy.defaultStrategy = b.copy.strategy["*"];
          }
        }
      } else {
        errors.push("bower.copy.strategy must be a string or an object");
      }
      if (!errors.length) {
        b.copy.strategyRegexs = [];
        Object.keys(b.copy.strategy).forEach(function(stratKey) {
          var stratRegex;
          if (regexRegex.test(stratKey)) {
            stratRegex = new RegExp(stratKey.substring(1, stratKey.length - 1));
            return b.copy.strategyRegexs.push({
              stratRegex: stratRegex,
              stratVal: b.copy.strategy[stratKey]
            });
          }
        });
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
      if (b.copy.pathMod) {
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
