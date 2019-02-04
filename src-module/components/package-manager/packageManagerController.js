angular.module('angular-leadgen')
    .controller('PackageManagerController', ['$scope', '$rootScope', '$log', 'ConfigService', 'LeadService',
        function($scope, $rootScope, $log, ConfigService, LeadService) {
            var electron = require('electron');

            try {
                const {version} = require(require('path').join(__dirname, '../../../package.json'));
                $scope.version = version;
            } catch (ex) {
                $scope.version = '0.1';
            }

            // get the various
            // configs
            var AppConfigService = new ConfigService({
                    type: 'app'
                }),
                LeadgenConfigService = new ConfigService({
                    type: 'leadgen'
                });

            // all the packages
            $scope.packages = [];
            $scope.loginError = false;
            $scope.leadgenUsername = '';
            $scope.leadgenPassword = '';

            /**
             * @function Attemps to login the user
             */
            $scope.attemptLogin = function(scope) {
                $scope.loginError = false;
                $scope.ready = false;
                LeadgenConfigService.login({
                    username: $scope.leadgenUsername,
                    password: $scope.leadgenPassword
                }).then(() => {
                    $log.debug('login was a success');
                    $scope.leadgenUsername = $scope.leadgenPassword = '';
                }).catch((reason) => {
                    $log.debug('login failed =>', reason);
                    $scope.loginError = true;
                }).finally(() => {
                    $scope.ready = true;
                    $scope.getPackages(true);
                });
            };

            /**
            * @function Logs the current user out
            */
            $scope.logout = function () {
                $scope.ready = false;
                LeadgenConfigService
                    .logout()
                    .catch((err) => {
                        $log.debug('error logging out =>', err);
                    })
                    .finally(() => {
                        $scope.ready = true;
                        $scope.getPackages(true);
                    });
            };

            /**
             * @function Loads a given package.
             */
            $scope.loadPackage = function(pkg) {
                $log.debug('app config =>', $rootScope.realAppConfig, $scope.realAppConfig, 'online =>', $rootScope.online);
                $rootScope.leadgen_page = 'app';
            };

            /**
             * @function See what packages are currently on
             * the device.
             */
            $scope.getPackages = function(force_keep) {
                $scope.ready = false;

                LeadgenConfigService.get()
                    .then(function(appConfig) {
                        $scope.appConfig = appConfig || {};
                        return AppConfigService.get();
                    })
                    .then(function(response) {
                        $scope.realAppConfig = response || {};

                        // if the page change wasnt initated by the user
                        // do a check to see where they
                        // should land
                        if (!$scope.userInitiatedPageChange) {
                            $rootScope.leadgen_page = ($scope.realAppConfig.autostart === true && !force_keep && (LeadService.getConfig().disable_leads || ($scope.appConfig.staff_code && !LeadService.getConfig().disable_leads))) ? 'app' : '';
                        }

                        // always revert back to
                        // the non-user initated state
                        $scope.userInitiatedPageChange = false;
                    })
                    .finally(function() {
                        $scope.ready = true;
                    });
            };

            $scope.getLatestPackage = function() {
                electron.ipcRenderer.send('db-request-refresh');
            };


            $scope.getPackages();
        }
    ]);