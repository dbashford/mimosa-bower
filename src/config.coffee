"use strict"

path = require "path"

_ = require "lodash"

regexRegex = /^\/.+\/$/

exports.defaults = ->
  bower:
    watch: true
    bowerDir:
      path: ".mimosa/bower/bower_components"
      clean: true
    copy:
      enabled: true
      trackChanges: true
      outRoot: null
      defaultStrategy: "packageRoot" # not exposed or documented
      strategy: "packageRoot"
      togetherRoot: "components"
      forceLatest: true
      exclude: []
      unknownMainFullCopy: false
      overridesArrays: {}  # not exposed or documented
      overridesObjects: {}  # not exposed or documented
      mainOverrides: {}
      pathMod: []

exports.placeholder = ->
  """
  \t
    # visit https://github.com/dbashford/mimosa-bower for full documentation
    # on mimosa-bower's configuration options
    bower:
      watch: true
      bowerDir:
        path: ".mimosa/bower/bower_components"
        clean: true
      copy:
        enabled: true
        trackChanges: true
        outRoot: null
        exclude:[]
        unknownMainFullCopy: false
        mainOverrides: {}
        strategy: "packageRoot"
        togetherRoot: "components"
        forceLatest: true
        pathMod: []
  """

strategyVal = (errors, strat, togetherRoot) ->
  if ["none", "vendorRoot", "packageRoot", "together"].indexOf(strat) is -1
    errors.push 'Invalid bower.copy.strategy used. Must be "none", "vendorRoot", "packageRoot", or "together".'
    false
  else
    if strat is "together" and not togetherRoot
      errors.push 'bower.copy.strategy of "together" used without a value set for "togetherRoot"'
      false
    else
      true

exports.validate = (config, validators) ->
  errors = []

  if validators.ifExistsIsObject(errors, "bower config", config.bower)
    b = config.bower

    validators.ifExistsIsBoolean(errors, "bower.watch", b.watch)

    if validators.ifExistsIsObject(errors, "bower.bowerDir", b.bowerDir)
      if validators.ifExistsIsString(errors, "bower.bowerDir.path", b.bowerDir.path)
        b.bowerDir.pathFull = path.join config.root, b.bowerDir.path
      validators.ifExistsIsBoolean(errors, "bower.outputFolder.clean", b.bowerDir.clean)

    if validators.ifExistsIsObject(errors, "bower.copy", b.copy)
      validators.ifExistsIsBoolean(errors, "bower.copy.enabled", b.copy.enabled)
      validators.ifExistsIsBoolean(errors, "bower.copy.trackChanges", b.copy.trackChanges)
      validators.ifExistsIsBoolean(errors, "bower.copy.forceLatest", b.copy.forceLatest)
      validators.ifExistsIsBoolean(errors, "bower.copy.unknownMainFullCopy", b.copy.unknownMainFullCopy)
      validators.isString(errors, "bower.copy.togetherRoot", b.copy.togetherRoot)

      if b.copy.outRoot is null
        b.copy.outRoot = ''
      else unless typeof b.copy.outRoot is "string"
        errors.push "bower.copy.outRoot must be a string or null."

      if typeof b.copy.strategy is "string"
        if strategyVal errors, b.copy.strategy, b.copy.togetherRoot
          b.copy.defaultStrategy = b.copy.strategy
          b.copy.strategy = {}
      else if typeof b.copy.strategy is "object" and not Array.isArray b.copy.strategy
        Object.keys(b.copy.strategy).forEach (key) ->
          unless typeof key is "string" and typeof b.copy.strategy[key] is "string"
            errors.push "bower.copy.strategy object must have a string key and a string value."
          else
            strategyVal errors, b.copy.strategy[key], b.copy.togetherRoot

        unless errors.length
          if b.copy.strategy["*"]
            b.copy.defaultStrategy = b.copy.strategy["*"]
      else
        errors.push "bower.copy.strategy must be a string or an object"

      unless errors.length
        b.copy.strategyRegexs = []
        Object.keys(b.copy.strategy).forEach (stratKey) ->
          # is strat key a regex?
          if regexRegex.test stratKey
            stratRegex = new RegExp(stratKey.substring(1, stratKey.length - 1))
            b.copy.strategyRegexs.push
              stratRegex: stratRegex
              stratVal: b.copy.strategy[stratKey]

      validators.ifExistsFileExcludeWithRegexAndString(errors, "bower.copy.exclude", b.copy, b.bowerDir.pathFull)

      if validators.ifExistsIsObject(errors, "bower.copy.mainOverrides", b.copy.mainOverrides)
        o = b.copy.mainOverrides
        Object.keys(o).forEach (pack) ->
          overrides = o[pack]
          if validators.isArray errors, "bower.copy.mainOverrides values", overrides
            overrides.forEach (override) ->
              if typeof override is "string"
                unless b.copy.overridesArrays[pack]
                  b.copy.overridesArrays[pack] = []
                b.copy.overridesArrays[pack].push override
              else if typeof override is "object" and not Array.isArray override
                unless b.copy.overridesObjects[pack]
                  b.copy.overridesObjects[pack] = {}

                Object.keys(override).forEach (oKey) ->
                  if typeof oKey is "string" and typeof override[oKey] is "string"
                    b.copy.overridesObjects[pack] = _.extend(b.copy.overridesObjects[pack], override)
                  else
                    errors.push "Objects provided to bower.copy.mainOverrides package array must have keys and values of strings"
              else
                errors.push "Items provided as bower.copy.mainOverrides entries must be objects or strings"

      if b.copy.pathMod
        if Array.isArray b.copy.pathMod
          if b.copy.pathMod.length is 0
            b.copy.pathMod = null
          else
            notString = false
            regexArray = []
            for item in b.copy.pathMod
              if typeof item is "string"
                regexArray.push "^#{item}$"
              else
                notString = true
                break

            if notString
              errors.push "bower.copy.pathMod must be a regex or an array of strings."
            else
              regexString = "(" + regexArray.join("|") + ")"
              b.copy.pathMod = new RegExp(regexString)
        else
          unless b.copy.pathMod instanceof RegExp
            errors.push "bower.copy.pathMod must be a regex or an array of strings."

  errors
