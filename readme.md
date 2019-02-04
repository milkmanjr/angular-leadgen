# Angular Leadgen

Leadgen, now available for Angular!

## Changelog ##
[View changelog here](CHANGELOG.md)

## Requires ##

* angular
* jquery


## How to use ##

(1) Add angular-leadgen to your package.json
`"angular-leadgen": "git@bitbucket.org:spinifexgrouplax/angular-leadgen.git#v1.6.19"`


(2) Do an npm install then add the following to the <head> of your application
`<link rel="stylesheet" href="/path/to/node_modules/angular-leadgen/dist-module/angular-leadgen.css" />`

(3) Require angular-leadgen in your angular 'bootstrap.js' file
`require('angular-leadgen')`

(3b) Require angular-leadgen's main process bindings in your 'main.js' file, passing in a reference to the main ipc.

```
#!javascript

require('angular-leadgen/main-process')
    .setup({ipc: ipcMain})
```


(c) Add angular-leadgen to the list of dependencies for your angular app
`angular.module('my-angular-app', ['angular-leadgen']) ..`


(4) You are all set! Add the leadgen admin by including this in your html
`<leadgen-admin></leadgen-admin>`


## License
UNLICENSED © [Spinifex Group](http://spinifexgroup.com)