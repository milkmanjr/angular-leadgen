angular.module('angular-leadgen')
    .factory('FlashMessageFactory', ['$timeout', function($timeout) {

        var factory = {};

        factory.flash = function (opts) {
            var $scope = opts.scope,
                key = opts.key,
                time = opts.time || 2000,
                message = opts.message;

            $scope[key] = message;
            $timeout(()=>{
                $scope[key] = '';
            }, time);
        };

        return factory;

    }]);