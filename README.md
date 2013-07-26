mimosa-bower
===========

## Overview

This module provides [Bower](http://bower.io) support to Mimosa. It allows for installing of Bower packages and moving of those packages to the appropriate location in a Mimosa application.  This module was coded against `bower-canary`, so is targeted for the 1.0 release of Bower.

For more information regarding Mimosa, see http://mimosajs.com

For more information regarding Bower, see http://bower.io

Note: Version `0.14.0` or higher of Mimosa is required to use this module.

## Usage

Run `mimosa mod:install mimosa-bower` to install this module into your global Mimosa install.

To install into a single project, add `'bower'` to your list of modules. Mimosa will install the module from NPM for you when you start up Mimosa.

## Functionality

If the `bower.copy.clean` option is not selected, then mimosa-bower will run when the mimosa `build` or `watch` commands start.  At that time mimosa-bower will assess if any `bower.json` packages need to be installed from the Bower registry.  If any packages have not been installed, the will be installed, and if any versions have updated, they will be installed too. mimosa-bower installs these packages to the `bower.bowerDir.path` directory, by default `.mimosa/bower_components`.

If any packages are installed, mimosa-bower then moves them into the `vendor` directories as indicated by Mimosa's `vendor` config introduced with `0.14.0`.  The `bower.copy.strategy` determines how the files are copied over.  They can be copied to the root of the vendor directory (`vendorRoot`), to the root of the component directory (`packageRoot`, the default), or can be copied keeping the entire folder structure intact, `none`.

mimosa-bower requires a valid `bower.json` at the root of project (in the same directory as mimosa-config).

If mimosa-bower encounters any version collisions, it will error out and indicate what those collisions are.

If mimosa-bower cannot identify the `main` file for a package because it hasn't been provided by the package author mimosa-bower will indicate that via a console log message. The `bower.copy.mainOverrides` can be used to indicate which files from the package are to use used.

## New Commands

The following commands are added to Mimosa when mimosa-bower is included in a project.

### bower & bower:install

`bower` and `bower:install` are identical commands. These commands provide one off access to Bower installs without kicking off `watch` or `build`.  If `bower.copy.clean` is set to `true`, this command is the only way to install Bower dependencies.

### bower:clean

`bower:clean` will remove all of the installed dependencies from their target directories in the `vendor` folder. It will also clean up any Bower package related folders that then become empty. Finally it will clean up the `bower.bowerDir.path` folder, removing all the temporary assets.

## Default Config

```coffeescript
bower:
  bowerDir:
    path: ".mimosa/bower_components"
    clean: false
  copy:
    enabled: true
    exclude:[]
    mainOverrides: {}
    strategy: "packageRoot"
    pathMod: ["js", "javascript", "javascripts", "css", "stylesheet", "stylesheets", "vendor", "lib"]
```

* `bowerDir.path`: string, the path to where mimosa-bower will initially install bower assets before moving the key assets into the `watch.sourceDir`
* `bowerDir.clean`: boolean, whether or not to remove temporary bower assets after install. If enabled, mimosa-bower will not auto-install bower dependencies when mimosa starts as that would cause mimosa to install everything every time. If clean is enabled, the "bower" command must be used to install dependencies.
* `copy.enabled`: boolean, whether or not to copy assets out of the `bowerDir.path` and into `watch.sourceDir`
* `copy.exclude`: An array of string paths or regexes. Files to exclude from
 copying. Paths should be relative to the `bowerDir.path` or absolute.
* `copy.mainOverrides`: Occasionally bower packages do not clearly indicate what file is the main library file. In those cases, mimosa-bower cannot find the main files to copy them to the vendor directory. json2 is a good example. `mainOverrides` allows for setting which files should be copied for a package. The key for this object is the name of the package. The value is an array of path strings representing the package's main files. The paths should be relative to the root of the package. For example: `{"json2":["json2.js","json_parse.js"]}`. The paths can also be to directories. That will include all the directory's files.
  `mainOverrides` packages can also be provided an object in addition to string paths. The object maps input paths to output paths and allow for specific placement of files and folders. Ex {"json2":{"json2.js":"json-utils/json2.js"}. In this case the "json2.js" file will be placed in "json-utils/json2.js" in the vendor.javascripts folder. If a file is provided as opposed to a directory, the output path must specify the output file name. Any directories copied in this way are copied entirely without manipulation of the folder structure.
* `copy.strategy`: string, the copying strategy. `"vendorRoot"` places all files at the root of the vendor directory. `"packageRoot"` places the files in the vendor directory in a folder named for that package. `"none"` will copy the assets into the vendor directory without modification. `strategy` can also be an object with keys that match the names of packages and values of strategy types. When using a `strategy` object, the key of `"*"` provides a default `strategy`. If only 2 of 10 packages are specified in the object, the rest get the "*" strategy. If no `"*"` is provided, `"packageRoot"` is the assumed default.
* `copy.pathMod`: pathMod can be an array of strings or a regexes. It is used to strip full pieces of a path from the output file when the selected `strategy` is `"none"`. If a bower package script is in `packageName/lib/js/foo.js` by default the output path would have "lib" and "js" stripped. Feel free to suggest additions to this based on your experience!


## Alternate Config

```coffeescript
bower:
  bowerDir:
    path: ".mimosa/bower_components"
    clean: false
  copy:
    enabled: true
    exclude:[]
    mainOverrides:
      foundation: [
        "js/foundation"
        {"scss":"foundation"}
      ]
    strategy:
      "*": "packageRoot"
      "jquery": "vendorRoot"
      "requirejs": "vendorRoot"
    pathMod: ["js", "javascript", "javascripts", "css", "stylesheet", "stylesheets", "vendor", "lib"]
```

* This shows the alternate `strategy` configuration using specific strategy-to-package mappings.
* It also shows the alternate `mainOverrides` configuration, with the `foundation` package's `js/foundation` folder being pulled in according to the `"*"` strategy (`packageRoot`), and the `foundation/scss` folder being pulled into a `foundation` folder and otherwise left entirely in tact without any path manipulations.