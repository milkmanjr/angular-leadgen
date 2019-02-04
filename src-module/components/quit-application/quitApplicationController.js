angular.module('angular-leadgen')
.controller('QuitApplicationController', ['$scope', 'ipc', 'electron',
    function($scope, ipc, electron) {
        $scope.handleQuitApplication = function () {
            console.log('APP SHOULD BE QUITTING....');
            ipc.send({command:'quit'})
        }
    }
]);
