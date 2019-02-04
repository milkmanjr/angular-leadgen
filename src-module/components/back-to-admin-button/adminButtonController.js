angular.module('angular-leadgen')
    .controller('AdminButtonController', ['$scope', '$rootScope', 'RedirectService',
        function($scope, $rootScope, RedirectService) {

            /**
             * @function Shows the admin after a double tap.
             */
            $scope.showAdmin = function() {
                RedirectService.notify();
                $rootScope.leadgen_admin_pin = false;
                $rootScope.leadgen_page = '';
            };

        }
    ]);