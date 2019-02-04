angular.module('angular-leadgen')
    .controller('appAutoBooterController', ['LeadService', 'FlashMessageFactory', function (LeadService, FlashMessageFactory) {
        var vm = this,
            AutoLaunch = require('auto-launch'),
            appAutoLauncher = new AutoLaunch(Object.assign({ name: 'SpinifexElectronApp' }, LeadService.getConfig().autoLaunch_options || {}));

        /**
        * @notes Defaults
        */
        vm.ready   = false;
        vm.enabled = '0';

        /**
        * @function Saves the autolaunch settings
        */
        vm.save = () => {
            if (vm.enabled === '1') {
              appAutoLauncher.enable();
            } else {
              appAutoLauncher.disable();
            }

            FlashMessageFactory.flash({
                scope: vm,
                key: 'message',
                message: 'Your auto launch settings were successfully saved.',
              });
          };

        /**
        * @function Gets the current status
        */
        vm.getStatus = () => {
            appAutoLauncher.isEnabled()
                .then((isEnabled) => {
                    vm.enabled = isEnabled ? '1' : '0';
                    vm.ready = true;
                  })
                .catch((err) => {});
          };

        vm.getStatus();

      }]);
