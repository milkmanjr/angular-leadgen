angular.module('angular-leadgen')
.controller('AppConfigController', ['$scope', 'ConfigService', '$log', 'FlashMessageFactory',
    function($scope, ConfigService, $log, FlashMessageFactory) {
        var AppConfigService = new ConfigService({type: 'app'});

        $scope.error = false;
        $scope.ready = false;

        // we will pull this down
        // from contentful once we
        // have ingestion working...
        $scope.appConfig = {
            app_mode: 'all'
        };

        // kick things off
        // by getting the accounts
        AppConfigService.get()
            .then(function(appConfig) {
                $scope.appConfig = appConfig || {
                    autostart: false
                };
            })
            .finally(function() {
                $scope.ready = true;
            });

        /**
         * @function Saves the config somewhere
         */
        $scope.saveConfig = function saveConfig() {
            $scope.ready = false;
            AppConfigService.update({
                autostart: $scope.appConfig.autostart || false
            })
                .catch((error) => {
                    $log.debug('failed to save =>', error);

                    FlashMessageFactory.flash({
                        scope: $scope,
                        key: 'flashMessage',
                        message:  'There was an error saving your changes'});

                })
                .then(function() {
                    $log.debug('saved app config =>', $scope.appConfig);

                    FlashMessageFactory.flash({
                        scope: $scope,
                        key: 'flashMessage',
                        message: 'Your changes were successfully saved.'});
                })
                .finally(()=>{
                     $scope.ready = true;
                });
        };

    }
]);