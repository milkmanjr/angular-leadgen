angular.module('angular-leadgen')
    .service('ArgsService', ['$q', function ($q) {
        var service = {};
        var ipcRenderer = require('electron').ipcRenderer;

        /**
        * @namespace A simple service that tells us all the arguments
        * that were passed to the command line.
        */
        service.get = function () {
            var deferred = $q.defer();

            ipcRenderer.once('process-args', function (event, data) {
                deferred.resolve(data);
            });

            ipcRenderer.send('get-process-args');

            return deferred.promise;
        }

        return service;
    }])
