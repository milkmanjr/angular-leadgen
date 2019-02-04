angular.module('angular-leadgen')
    .controller('MonroneyModalController', ['$uibModalInstance', 'ConfigService', '$scope', 'RedirectService',
        function ($uibModalInstance, ConfigService, $scope, RedirectService) {
        var vm = this,
            AppConfig = new ConfigService({type: 'app'});

        vm.zoomLevel      = 100;
        vm.zoomLowerLimit = 100;
        vm.zoomUpperLimit = 400;

        vm.close = () => {
            $uibModalInstance.close();
        };

        vm.zoomIn = () => {
            if (vm.zoomLevel >= vm.zoomUpperLimit) return;
            vm.zoomLevel+=50;
        };

        vm.zoomOut = () => {
            if (vm.zoomLevel <= vm.zoomLowerLimit) return;
            vm.zoomLevel-=50;
        };

        /**
        * @function Grabs the config to see
        * what the currently selected sticker is.
        */
        AppConfig.get()
            .then((config) => {
                vm.sticker = config.selectedSticker;
            });

        /**
        * @notes If we go to to the admin screen,
        * go ahead and close this overlay.
        */
        RedirectService.subscribe($scope, () => {
            vm.close();
        });
    }]);