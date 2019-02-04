angular.module('angular-leadgen')
    .controller('AdvancedOptionsController', ['$log', 'ArgsService', function ($log, ArgsService) {
        var vm = this;

        vm.process = process;

        // are we on windows?
        vm.onWindows = vm.process.platform != 'darwin' && vm.process.platform != 'linux';

        // started through batch script?
       ArgsService.get()
        .then((data) => {
            vm.startedViaBat = data.started_via_bat ? true : false;
        });

    }]);