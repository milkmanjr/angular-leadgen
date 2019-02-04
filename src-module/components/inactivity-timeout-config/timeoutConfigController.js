angular.module('angular-leadgen')
    .controller('TimeoutConfigController', ['ConfigService', 'FlashMessageFactory', function (ConfigService, FlashMessageFactory) {
        var vm = this,
            AppConfig = new ConfigService({type: 'app'});

        /**
        * @function Save what we got
        */
        vm.save = function () {

            // make sure inactivity is set
            // that it is a number
            // and that it is greater than 0
            if (!vm.inactivityCheckSeconds  || isNaN(vm.inactivityCheckSeconds) || parseInt(vm.inactivityCheckSeconds, 10) <= 0) {
                FlashMessageFactory.flash({
                    scope: vm,
                    key: 'errorMessage',
                    message: 'Please enter a valid inactivity time.'
                })
                return;
            }

            // update the app config
            AppConfig
                .update({
                    inactivityCheckSeconds: parseInt(vm.inactivityCheckSeconds, 10)
                })
                .then(() => {
                    FlashMessageFactory.flash({
                        scope: vm,
                        key: 'message',
                        message: 'The timeout was successfully updated.'
                    })
                });
        };

        /**
        * @notes Get the inactivity in seconds from the app config, if it
        * is infact there.
        */
        AppConfig.get()
            .then((config) => {
                vm.inactivityCheckSeconds = config.inactivityCheckSeconds || '';
            });

    }]);