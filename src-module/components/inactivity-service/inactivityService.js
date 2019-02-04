angular.module("angular-leadgen")
    .factory('InactivityService', ['$window', '$timeout', '$log', '$rootScope',
        function($window, $timeout, $log, $rootScope) {
            var factory = {},
                jQuery = $window.jQuery;

            /**
             *@namespace Keeps the options it was
             * intially created with.
             */
            factory.initOpts = {};

            /**
             * @function Initalizes the module
             */
            factory.init = function(opts) {
                factory.initOpts = opts || {};
                factory.setup();
            };

            /**
             * @function Sets up the timeout
             */
            factory.setup = function() {
                var opts = factory.initOpts;

                $log.debug('inactivity service started, ' + (opts.limit/1000/60) + ' minutes');

                factory.timeout = $timeout(() => {
                    if (typeof opts.callback == 'function') {
                        opts.callback();
                    }
                    factory.reset();
                }, opts.limit || 60000);

                jQuery(document).on('click.inactivty keyup.inactivty touchstart.inactivty touchend.inactivty dragstart.inactivty dragend.inactivty scroll.inactivty', factory.reset);
            };

            /**
             * @function Resets the timeout
             */
            factory.reset = function() {
                factory.teardown();
                factory.setup();
            };

            /**
             * @function When its all said and done
             */
            factory.teardown = function() {
                $timeout.cancel(factory.timeout);
                $log.debug('inactivity service paused');
                jQuery(document).off('.inactivty');
            };

            return factory;
        }
    ]);