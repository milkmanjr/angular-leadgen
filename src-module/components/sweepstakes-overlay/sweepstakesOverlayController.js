angular.module('angular-leadgen')
    .controller('SweepstakesOverlayController', ['$scope', '$uibModalInstance', 'sweeps_html',
        function($scope, $uibModalInstance, sweeps_html) {

            /**
             *@notes Values that come from the uibModal from
             * a parent controller somewhere out there..
             */
            $scope.sweeps_html = sweeps_html;

            $scope.ok = function() {
                $uibModalInstance.close();
            };

        }
    ]);