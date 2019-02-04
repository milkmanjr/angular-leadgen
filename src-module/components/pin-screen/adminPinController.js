angular.module('angular-leadgen')
    .controller('AdminPinController', ['$scope', '$timeout', '$rootScope', 'ConfigService', 'LeadService', 'ArgsService', '$log',
        function($scope, $timeout, $rootScope, ConfigService, LeadService, ArgsService, $log) {
            var timer,
                leadgenConfig = new ConfigService({
                    type: 'leadgen'
                });

            $scope.leadgenConfig;

            // this will end up being
            // the ngModel
            $scope.currentPin = '';

            // max length for the pin
            $scope.maxLength = 10;

            // is the form invalid yet?
            $scope.notValid = false;

            // grab the leadgen config
            // this will be used to test if we have
            // a valid config
            leadgenConfig.get()
                .then((response) => {
                    $scope.leadgenConfig = response;
                });

            /**
             * @function Checks to see if the current PIN is the right one,
             * if it is -- let them into the admin interface.
             */
            $scope.enter = function() {
                if ($scope.currentPin == '1776') {
                    $scope.pinEnteredSuccessfully();
                } else {
                    $scope.notValid = true;
                    var timer = $timeout(() => {
                        $scope.currentPin = '';
                        $scope.notValid = false;
                    }, 500);
                }
            };

            /**
             * @function Sends the user back to the app
             */
            $scope.backToApp = function() {
                $rootScope.leadgen_page = 'app';
                $scope.currentPin = '';
            };

            /**
             * @function Adds a number to the pin that we will validate
             */
            $scope.addNumber = function(number) {
                if ($scope.currentPin.length >= $scope.maxLength) {
                    return;
                }
                $scope.currentPin += '' + number;
            };

            /**
             * @function Clears the current pin
             */
            $scope.clear = function() {
                $scope.currentPin = '';
            }

            $scope.$on('$destroy', () => {
                $timeout.cancel(timer);
            });
        }
    ]);