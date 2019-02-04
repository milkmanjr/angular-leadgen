angular.module('angular-leadgen')
    .controller('AdminWorkerController', ['$scope', '$interval', 'LeadService', '$log', '$rootScope', 'InactivityService', 'AnalyticService', '$injector', 'ConfigService', 'PubSub',
        function($scope, $interval, LeadService, $log, $rootScope, InactivityService, AnalyticService, $injector, ConfigService, PubSub) {

            // amount of time to check in seconds
            var AppConfig = new ConfigService({type: 'app'}),
                check = 1 * 60 * 1000, // every 1 minute(s)
                inactivityCheck = 3 * 60 * 1000, // 3 minutes
                isOnline = require('is-online'),
                syncInterval;

            /**
             * @function Performs actions every x interval
             */
            $scope.actions = function() {
                $log.debug('attempting to auto-sync all leads and analytics');

                LeadService.syncAllLeads()
                    .catch(function () {
                        $log.debug('did not sync, couldn\'t reach leadgen server');
                    })
                    .finally(function() {});

                AnalyticService.syncAllAnalytics()
                    .catch(function() {
                        $log.debug('did not sync, couldn\'t reach leadgen server');
                    })
                    .finally(function() {});

                isOnline(function(err, online) {
                    $log.debug('checking internet connection');
                    $rootScope.online = (!err && online) ? true : false;
                    $rootScope.$apply();
                });

            };

            /**
            * @function Starts the inactivity service
            */
            $scope.initInactivityService = function (config) {
                InactivityService.init({
                    limit: config.inactivityCheckSeconds ? (config.inactivityCheckSeconds * 1000) : inactivityCheck,
                    callback: function() {
                        // new user now
                        // change the UUID
                        AnalyticService.changeUniqueId();

                        // run the inactivity callabck
                        if (LeadService.getConfig() && LeadService.getConfig().inactivity_callback && typeof LeadService.getConfig().inactivity_callback == 'function') {
                            LeadService.getConfig().inactivity_callback($injector);
                        }
                    }
                });
            };

            /**
            * @notes Get the app config, and try and grab the timeout from
            * there if it exists.
            */
            AppConfig.get()
                .then((config) => {
                // run it once
                $scope.actions();

                // setup Analytics Service
                AnalyticService.init();

                // send all the leads that
                // have not been synced yet
                // every X minutes
                syncInterval = $interval($scope.actions, check);

                // when there is inactivity
                // send the user back to the attract loop
                $scope.initInactivityService(config);
            });

            PubSub.subscribe('app.configUpdate', (response) => {
                if (response.data.inactivityCheckSeconds) {
                    $log.debug('app config updated, resetting inactivity service -- ' + response.data.inactivityCheckSeconds + 's');
                    InactivityService.teardown();
                    $scope.initInactivityService(response.data);
                }
            });

            // when this gets destroyed
            // stop the interval
            $scope.$on('$destroy', function() {
                $interval.cancel(syncInterval);
                InactivityService.teardown();
            });
        }
    ])