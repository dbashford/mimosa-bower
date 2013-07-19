mimosa-bower
===========

## Overview

This module provides [Bower](http://bower.io) support to Mimosa. It allows for installing of Bower packages and moving of those packages to the appropriate location in a Mimosa application.  This module was coded against `bower-canary`, so is targeted for the 1.0 release of Bower.

For more information regarding Mimosa, see http://mimosajs.com

For more information regarding Bower, see http://bower.io

Note: Version `0.14.0` or higher of Mimosa is required to use this module.

## Usage

Add `'bower'` to your list of modules.  That's all!  Mimosa will install the module from NPM for you when you start up.

## Functionality

If the `bower.copy.clean` option is not selected, then mimosa-bower will run when the mimosa `build` or `watch` commands start.  At that time mimosa-bower will assess if any `bower.json` packages need to be installed from the Bower registry.  If any packages have not been installed, the will be installed, and if any versions have updated, they will be installed too. mimosa-bower installs these packages to the `bower.bowerDir.path` directory, by default `.mimosa/bower_components`.

If any packages are installed, mimosa-bower then moves them into the `vendor` directories as indicated by Mimosa's `vendor` config introduced with `0.14.0`.  The `bower.copy.strategy` determines how the files are copied over.  They can be copied to the root of the vendor directory, `vendorRoot`, to the root of the component directory `packageRoot` or can be copied keeping the entire folder structure intact, `none`.

mimosa-bower requires a valid `bower.json` to be in place.

If mimosa-bower encounters any version collisions, it will error out and indicate what those collisions are.

If mimosa-bower cannot identify the `main` file for a package because it hasn't been provided by the package author mimosa-bower will indicate that via a console log message. The `bower.copy.mainOverrides` can be used to indicate which files from the package are to use used.

mimosa-bower also adds 2 new commands to Mimosa.

### bower & bower:install

`bower` and `bower:install` are identical commands. These commands provide one off access to Bower installs without kicking off `watch` or `build`.  If `bower.copy.clean` is set to `true`, this command is the only way to install Bower dependencies.

### bower:clean

`bower:clean` will remove all of the installed dependencies from their target directories in the `vendor` folder. It will also clean up any Bower package related folders that then become empty. Finally it will clean up the `bower.bowerDir.path` folder, removing all the temporary assets.

## Default Config

```
bower:                # Configuration for bower module
  bowerDir:
    path: ".mimosa/bower_components"  # The location mimosa-bower places temporary bower
                                      # assets.
    clean: false              # whether or not to remove temporary bower assets after install
                              # If enabled, mimosa-bower will not auto-install bower
                              # dependencies when mimosa starts as that would cause mimosa to
                              # install everything every time. If clean is enabled, the
                              # "bower" command must be used to install dependencies.

  copy:                       # configuration for the copying of assets from bower temp
                              # directories into the project
    enabled: true             # whether or not to copy the assets out of the bowerDir.path
                              # into the project vendor location
    exclude:[]                # An array of string paths or regexes. Files to exclude from
                              # copying. Paths should be relative to the bowerdir.path or
                              # absolute.
    mainOverrides: {}         # Occasionally bower packages do not clearly indicate what file
                              # is the main library file. In those cases, mimosa cannot find
                              # the main files in order to copy them to the vendor directory.
                              # json2 is a good example. This setting allows for setting
                              # which files should be copied for a package. The key for this
                              # object is the name of the package. The value is an array of
                              # path strings representing the package's main files. The paths
                              # should be relative to the root of the package. For example:
                              # {"json2":["json2.js","json_parse.js"]}
    strategy: "packageRoot"   # The copying strategy. "vendorRoot" places all files at the
                              # root of the vendor directory. "packageRoot" places the files
                              # in the vendor directory in a folder named for that package.
                              # "none" will copy the assets into the vendor directory without
                              # modification.
    pathMod: ["js", "javascript", "javascripts", "css", "stylesheet", "stylesheets", "vendor", "lib"]
                              # pathMod can be an array of strings or a regex. It is used to
                              # strip full pieces of a path from the output file when the
                              # selected strategy is "none". If a bower package script is in
                              # "packageName/lib/js/foo.js" by default the output path would
                              # have "lib" and "js" stripped. Feel free to suggest additions
                              # to this based on your experience!
```

## Example Config

```
```