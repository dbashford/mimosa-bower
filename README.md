mimosa-bower
===========

# Overview

This is a Bower integration module for the Mimosa build tool.

For more information regarding Bower, see http://bower.io/.

For more information regarding Mimosa, see http://mimosa.io.

# What is Bower?

This is how Bower describes itself:

> Bower is a package manager for the web. It offers a generic, unopinionated solution to the problem of front-end package management, while exposing the package dependency model via an API that can be consumed by a more opinionated build stack. There are no system wide dependencies, no dependencies are shared between different apps, and the dependency tree is flat.

It mentions an "opinionated build stack". This module is an opinionated usage of Bower for Mimosa.

# Usage

### Including the module

Add `'bower'` to your list of modules.  That's all!  Mimosa will install the module for you when you start `mimosa watch` or `mimosa build`.

### During `mimosa watch` and `mimosa build`

When `mimosa watch` or `mimosa build` start, mimosa-bower will attempt to detect if an install is needed and if it is an install will be run before assets are processed.

### Additional Commands

When mimosa-bower is included in your project, the following commands are available.

#### `bower`

`mimosa bower` provides one off access to Bower installs without kicking off `mimosa watch` or `mimosa build`.

#### `bower:install <names,of,modules> [-d/--savedev]`

`mimosa bower:install` will install one to many modules into your application and save the new modules to the dependencies array of the `bower.json`. To save to the `devDependencies`, add a `[-d/--savedev]` flag. You can even use version numbers when installing modules. Example: `mimosa bower:install backbone,underscore,jquery#1.8.1`

#### `bower:clean [-c/--cache]`

`mimosa bower:clean` will remove all of the Bower installed dependencies from their target directories in the vendor folder. It will also clean up any Bower package related folders that then become empty. Finally it will clean up the `bower.bowerDir.path` folder, removing all the temporary assets.

`mimosa bower:clean --cache`, in addition to cleaning up installed dependencies, will also clean the Bower cache. This often is necessary when Bower updates, or if packages get updated without new versions.

# Functionality

mimosa-bower requires a valid `bower.json` at the root of project (in the same directory as `mimosa-config`).

### When will a Bower install be kicked off?

When `mimosa bower`, `mimosa watch` or `mimosa build` are executed, mimosa-bower will assess whether or not any packages need to be installed and install them to the `bower.bowerDir.path` directory, by default `.mimosa/bower/bower_components`.

If `bower.copy.trackChanges` is set to `true` (the default), mimosa-bower keeps track of two artifacts to help it determine if installs need to occur. First, it keeps track of the `bower.json` that was last used for an install. If the current `bower.json` is different, an install will be executed. Second, mimosa-bower keeps track of the `bower` section of your project's `mimosa-config` for the last install. If it changes, an install will be executed.

If `bower.copy.trackChanges` is set to `false` and `bower.bowerDir.clean` is set to `false`, Bower default processing will check to see if an install is necessary based on the contents of the `bower.bowerDir.path`. If it detects that nothing has changed, no install will be run.

If `bower.copy.trackChanges` is set to `false` and `bower.bowerDir.clean` is set to `true` (not recommended), then mimosa-bower has no way to determine if an install is necessary so the Bower functionality does not register itself to be run during `mimosa watch` and `mimosa build`. In this case it must be executed using the `mimosa bower` command.

### Where are assets initially copied?

`bower.bowerDir.path` is the location where all of the package assets are initially copied by Bower. In most cases this include the entire contents of the GitHub repositories for the packages you have selected.

Because it uses entire GitHub repositories, and you probably do not want that code inside your project's source directories, `bower.bowerDir.path` is set to `.mimosa/bower_components`.

It is the goal of the rest of the configuration, covered below, to decide what are the key files from each package, and where in your source directories those files should be placed.  By default, once the assets are copied into your project's source, the content of `bower.bowerDir.path` is cleaned.  To turn this off, set `bower.bowerDir.clean` to `false`.

### What assets are copied into the project's source?

If `bower.copy.enabled` is set to `true` then mimosa-bower will attempt to copy files from the `bower.bowerDir.path` and into your project's source code.

By default, mimosa-bower expects to find a `main` property in the `bower.json` of any packages it uses. If mimosa-bower cannot identify the main files for a package because a `main` property hasn't been provided by the package author, mimosa-bower will indicate that via a message to the console. In cases where the `main` files are not provided, or when you want to include files other than the ones the package author has indicated, you can use `bower.copy.mainOverrides`.

The [jquery bower.json](https://github.com/jquery/jquery/blob/2.1.3/bower.json) indicates that `jquery.js` is the `main` file. By default mimosa-bower will copy that file in.  If you want the minified file, you would need to provide a `mainOverrides` config.

The following config will copy in both the `jquery.js` and the `jquery.min.js`
```javascript
bower: {
  copy: {
    mainOverrides: {
      jquery:["dist/jquery.js", "dist/jquery.min.js"]
    }
  }
}
```

#### Version collisions?

If Bower encounters any version collisions -- for instance if two different packages have a dependency on the same library, but different versions -- it will automatically choose the latest version for that library because `bower.copy.forceLatest` is set to `true` by default. If it is not set to `true`, the Bower install will error out and the collision will need to be addressed.

A typical way to address collisions is to use the `resolutions` config in the `bower.json`.

### Copying assets into a project using `strategy` and `mainOverrides`

For the explanations below, I'll use [the leaflet.draw  package](https://github.com/Leaflet/Leaflet.draw/tree/0521a42c4e9bfb336dc62ead1e1492563b3811bd) for an example. leaflet.draw has the following assets as specified by the `main` property in its [`bower.json`](https://github.com/Leaflet/Leaflet.draw/blob/0521a42c4e9bfb336dc62ead1e1492563b3811bd/bower.json#L5-L10).

```
dist/
  leaflet.draw-src.js
  leaflet.draw.css
  images/
    spritesheet-2x.png
    spritesheet.png
```

When packages are installed, mimosa-bower moves the `main` files into the vendor directories as indicated by Mimosa's `vendor` config. The `bower.copy.strategy` and/or `bower.copy.mainOverrides` determine how those `main` files are copied over.

#### Strategy: packageRoot (the default strategy)

`packageRoot` places files inside a folder named for the package within the appropriate `vendor` directory.  This strategy will flatten any folder structure. This strategy will also pull apart `.js` files and place them in `vendor.javascripts` while everything else goes in `stylesheets`.

For leaflet.draw, an example `packageRoot` output given Mimosa's defaults would be:

```
/javascripts
  /vendor
    /leaflet.draw
      leaflet.draw-src.js
/stylesheets
  /vendor
    /leaflet.draw
      leaflet.draw.css
      spritesheet-2x.png
      spritesheet.png
```

Note that non-js files end up in `stylesheets` and note that the folder structure has been flatted (there is no `images` folder).

#### Strategy: vendorRoot

`vendorRoot` places files directly in the `vendor` folder.  This strategy will flatten any folder structure.  This strategy will also pull apart `.js` files and place them in `vendor.javascripts` while everything else goes in `stylesheets`.

For leaflet.draw, an example `vendorRoot` output given Mimosa's defaults would be:

```
/javascripts
  /vendor
    leaflet.draw-src.js
/stylesheets
  /vendor
    leaflet.draw.css
    spritesheet-2x.png
    spritesheet.png
```

Note that non-js files end up in `stylesheets` and note that the folder structure has been flatted (there is no `images` folder).

#### Strategy: none

`none` is the same as `packageRoot`, but it will not flatten folder structures.  This strategy will pull apart `.js` files and place them in `vendor.javascripts` while everything else goes in `stylesheets`.

For leaflet.draw, an example `none` output given Mimosa's defaults would be:
```
/javascripts
  /vendor
    /leaflet.draw
      /dist
        leaflet.draw-src.js
/stylesheets
  /vendor
    /leaflet.draw
      /dist
        leaflet.draw.css
        /images
          spritesheet-2x.png
          spritesheet.png
```

Note that non-js files end up in `stylesheets` and note that the folder structure has not been flatted (there is an `images` and `dist` folder).

#### Strategy: together

`together` allows packages that contained mixed content, like Polymer components, to remain together. Anything having a strategy of `together` will be placed in the `bower.copy.togetherRoot` folder which is set to `components` by default.  `togetherRoot` is relative to `watch.sourceDir` so it sits at the same level as `stylesheets` and `javascripts`.  `together` will not flatten directories.

For leaflet.draw, an example `together` output given Mimosa's defaults would be:
```
/components
  /leaflet.draw
    /dist
      leaflet.draw-src.js
      leaflet.draw.css
      /images
        spritesheet-2x.png
        spritesheet.png
```

#### `mainOverrides` object copy

If you want to be very specific about what assets you want and where you want them to go, you can use `mainOverrides`.

Consider the following `mainOverrides` config.

```javascript
bower: {
  copy: {
    mainOverrides:{
      "font-awesome": [
        "css/font-awesome.css",
        "css/font-awesome-ie7.css",
        { font: "../../font" }
      ]
    }
  }
}
```

The `mainOverrides` above has three entries. Two of them are simply `.css` files.  These files will be copied into `vendor.stylesheets` according to the `strategy` that applies to `font-awesome` (in the above case it is `packageRoot` because that is the default and no other `strategy` has been supplied).  By referring to the files directly, the files will be copied in without their `css` folder included.

The 3rd entry is an object.  This object can be used to take very specific files and folders and place them in very specific places.  In this case the `font` folder inside the `font-awesome` package will be placed at `../../font`.  The path is relative to `vendor.stylesheets` because that is where these assets would be placed otherwise.  So, in this case, a `font` folder will be created at the same level as `javascripts`.

```
/javascripts
  /vendor
/stylesheets
  /vendor
    /font-awesome
      font-awesome.css
      font-awesome-ie7.css
/font
  -- the contents of the font-awesome/font directory --
```

# Default Config

```javascript
bower: {
  watch:true,
  bowerDir: {
    path: ".mimosa/bower_components",
    clean: true
  },
  copy: {
    enabled: true,
    trackChanges: true,
    outRoot: null,
    exclude:[],
    unknownMainFullCopy: false,
    mainOverrides: {},
    strategy: "packageRoot",
    togetherRoot: "components",
    forceLatest: true,
    pathMod: []
  }
}
```

* `bower.watch`, a boolean, when `true`, mimosa-bower will watch the `bower.json` for changes, and when the file changes, run a Bower install.
* `bower.bowerDir.path`, a string, the path to where mimosa-bower will initially install Bower assets before moving the key assets into the `watch.sourceDir`. This is relative to the root of the project.
* `bower.bowerDir.clean`, a boolean, indicates whether or not to remove temporary Bower assets after install. Bower downloads entire GitHub repositories, so cleaning them keeps your project from having those kept around.
* `bower.copy.enabled`, a boolean, indicates whether or not to copy assets out of the `bowerDir.path` and into `watch.sourceDir`.
* `bower.copy.trackChanges`, a boolean.  See [When will a Bower install be kicked off?](#When-will-a-Bower-install-be-kicked-off) above.
* `bower.copy.outRoot`, a string, path to append to the vendor directories before copying in assets. All copied assets would go inside this directory. Example: "bower-managed". `null`, the default, means no `outRoot` is applied.
* `bower.copy.exclude`, an array of strings/regexes that match files to exclude from copying. Paths should be relative to the `bowerDir.path` or absolute. String paths must include the file name.
* `bower.copy.unknownMainFullCopy`, a boolean, when set will force the copy of all Bower module assets into the vendor output directory. This will likely copy a lot of undesirable assets, but if that isn't a problem, setting this property is a quick way to get files copied over without the hassle of configuring `mainOverrides` (below).
* `bower.copy.mainOverrides`, an object, allows for setting which files should be copied for a package either when the `main` files cannot be determined or when files other than the `main` files are desired. The key for this object is the name of the package. The value is an array of path strings pointing to the package's desired files. The paths should be relative to the root of the package. For example: `{"json2":["json2.js","json_parse.js"]}`. When paths point to directories, all the directory's files will be copied. `mainOverrides` packages can also be provided an object in addition to string paths. The object maps input paths to output paths and allow for specific placement of files and folders. Ex `{"json2":[{"json2.js":"json-utils/json2.js"}]`. In this case the `json2.js` file will be placed in `json-utils/json2.js` in the `vendor.javascripts` folder. If a file is provided as opposed to a directory, the output path must specify the output file name. Any directories copied in this way are copied entirely without manipulation of the folder structure.
* `bower.copy.strategy`, a string or an object, the copying strategy. See above docs for details on strategies. When using a string, all packages will use the provided `strategy`.  When using an object, the keys should match the names of packages and values should be specific strategy types. The key of `*` provides a default strategy if `packageRoot` is not desired. If only 2 of 10 packages are specified in the object, the rest get the `*`/default strategy.
* `bower.copy.togetherRoot`, a string, the path, relative to `watch.sourceDir`, where packages with the `together` `strategy` will be placed.
* `bower.copy.forceLatest`, a boolean, a means to quickly fix any problems with library version collisions. If you want to install the latest `jquery`, but one of your other libraries wants to install an older version the install will fail. This flag will ensure the the latest version is selected and the Bower install will continue. When the `forceLatest` results in a selection, a warning message is logged with the details of which version was picked and which versions were not.
* `bower.copy.pathMod`, an array of strings or regexes used to strip full pieces of a path from the output file when the selected strategy is `none` or a `mainOverrides` object is used. For example, if a Bower package script is in `packageName/lib/js/foo.js` and `pathMod` is set to ["lib", "js"] the output path would have `lib` and `js` stripped.

## Example Config

```javascript
bower: {
}
```