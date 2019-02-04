angular.module('angular-leadgen')
    .controller('LeadgenConfigController', ['$scope', 'LeadService', 'ConfigService', '$log', 'FlashMessageFactory',
        function($scope, LeadService, ConfigService, $log, FlashMessageFactory) {
            var LeadgenConfigService = new ConfigService({
                type: 'leadgen'
            });

            $scope.error = false;
            $scope.ready = false;

            $scope.applications = [];
            $scope.accounts = [];
            $scope.deviceCodes = [];
            $scope.events = [];
            $scope.formats = [];

            $scope.currentAccount = {};
            $scope.currentEvent = {};
            $scope.currentApplication = {};
            $scope.currentDevice = {
                device_code: LeadService.getConfig('device_code')
            };
            $scope.currentFormat = {};
            $scope.currentMeta = {};
            $scope.appConfig = {};

            /**
            * @notes Loads when the controller is first initialized.
            */
            LeadgenConfigService.get()
                .then(function(appConfig) {
                    $scope.appConfig = appConfig || {};

                    // sane defaults
                    if (!$scope.appConfig.collection_method) {
                        $scope.appConfig.collection_method = 'wheelstand'
                    }

                    $log.debug('current app config => ', $scope.appConfig);

                    if ($scope.appConfig.account) {
                        $scope.currentAccount = $scope.appConfig.account;
                    }

                    if ($scope.appConfig.application) {
                        $scope.currentApplication = $scope.appConfig.application;
                        $log.debug('changing application up =>', $scope.currentApplication);
                       // $scope.$apply();
                    }
                 // kick things off
                // by getting the accounts
                return LeadService.getAccounts({});

                })
                .then(function(response) {
                    $scope.accounts = response.data;

                    // auto set the account if there is only one
                    if ($scope.accounts.length == 1) {
                        $scope.currentAccount = $scope.accounts[0];
                        $scope.lockedAccount = true;
                    }

                    $scope.changeAccount();
                })
                .catch(function() {
                    $scope.error = true;
                })
                .finally(function() {
                    $scope.ready = true;

                    // if there are applications
                    // and
                     if ($scope.appConfig.application && $scope.currentAccount &&
                        $scope.currentAccount.account_id &&
                        $scope.appConfig.application.map_accounts == $scope.currentAccount.account_id) {

                        // make the current application
                        // one of them from the top
                        $scope.currentApplication = $scope.appConfig.application;
                        $scope.changeApplication();

                        if ($scope.appConfig.event) {
                            $scope.currentEvent = $scope.appConfig.event;
                            $log.debug('set the event =>', $scope.currentEvent)
                            $scope.changeEvent();
                        }
                    }
                });

            /**
             * @function Resets all the values
             */
            $scope.reset = function reset(scopes) {
                for (var x in scopes) {
                    $scope['current' + scopes[x]] = {};
                }
            };

            /**
             * @function Saves the config somewhere
             */
            $scope.saveConfig = function saveConfig() {
                $scope.ready = false;

                LeadgenConfigService.update({
                    collection_method: $scope.appConfig.collection_method,
                    customCmethod: $scope.appConfig.customCmethod,
                    vehicle_make: LeadService.getConfig('vehicle_make') || '',
                    account: $scope.currentAccount,
                    application: $scope.currentApplication,
                    device: $scope.currentDevice,
                    event: $scope.currentEvent,
                    staff: $scope.staff,
                    all_events: $scope.events,
                    staff_code: ''
                }).then(function() {

                    return LeadgenConfigService.downloadSweepstakesRules($scope.events);

                }).then(function (sweepstakes_rules_local) {

                    $scope.sweepstakes_rules_local = sweepstakes_rules_local;

                    return LeadService.getApplicationValidation({
                        params: {
                            vehicle_make_name: LeadService.getConfig().vehicle_make || false
                        }
                    });

                }).then(function (car_rules_response) {

                    return LeadgenConfigService.update({
                        all_sweepstakes_rules: $scope.sweepstakes_rules_local,
                        car_rules: car_rules_response.data || {}
                    });

                }).then((response) => {

                    // head back to packages page.
                    $scope.dismiss = false;
                    $scope.leadgen_enabled = true;

                    // resets the page
                    // pass true to not kick us out
                    $scope.getPackages(true);
                })
                .catch((response) => {
                    $log.debug('saving leadgen config failed =>', response);
                    FlashMessageFactory.flash({
                        scope: $scope,
                        key: 'errorMessage',
                        errorMessage: 'There was an error saving your settings.',
                      });
                }).finally(() => {
                    $scope.ready = true;
                    FlashMessageFactory.flash({
                        scope: $scope,
                        key: 'message',
                        message: 'Your settings were successfully saved.',
                      });
                });
            };

            /**
             * @function Change config button (if it hasnt been set yet)
             */
            $scope.changeConfig = function changeConfig() {
                $scope.dismiss = true;
            };

            /**
             * @function Handles when the account is changed
             */
            $scope.changeAccount = function changeAccount() {
                $log.debug('current account =>', $scope.currentAccount);

                // reset all the current values
                $scope.reset(['Application', 'Event', 'DeviceCode', 'Format']);

                // get all the applications
                // for this account
                LeadService.getApplicationsByAccountId({
                    params: {
                        account_id: $scope.currentAccount.account_code
                    }
                }).then(function(response) {
                    $scope.lockedApplication = false;
                    $scope.applications = response.data.filter((app) => { return !app.application_name.match(/analytics/gi); });

                    if ($scope.applications.length == 1) {
                        $scope.lockedApplication = true;
                        $scope.currentApplication = $scope.applications[0];
                        $scope.changeApplication();
                    }

                    if ($scope.currentApplication.application_id) {
                        $scope.currentApplication = $scope.applications.filter((app) => {
                            return app.application_id == $scope.currentApplication.application_id;
                        })[0]
                        $scope.changeApplication();

                    }
                })
                .catch(function () {
                    $log.debug('could not get applications.');
                });
            }

            /**
             * @function Handles when the application is changed
             */
            $scope.changeApplication = function changeApplication() {
                $log.debug('current application =>', $scope.currentApplication);

                // reset only the device code
                // and format
                if (($scope.currentApplication && $scope.lockedApplication) || $scope.currentEvent.id) {
                    $scope.reset(['DeviceCode', 'Format']);
                    $log.debug('current event =>', $scope.currentEvent);
                } else {
                    $scope.reset(['DeviceCode', 'Event', 'Format']);
                }

                $scope.events = [];

                // get all the formats
                LeadService.getEventData({
                    params: {
                        account: $scope.currentAccount.account_code,
                        version: '1.0',
                        time: (new Date()).getTime(),
                        device_code: $scope.currentDevice.device_code,
                        application_code: $scope.currentApplication.application_code

                    }
                }).then(function(response) {
                    $scope.events = response.data && response.data.events_list && response.data.events_list.list ? response.data.events_list.list : [];
                    $scope.staff = response.data && response.data.staff_list && response.data.staff_list.list ? response.data.staff_list.list : [];

                    if ($scope.currentEvent && $scope.currentEvent.code) {
                         $scope.currentEvent = $scope.events.filter((_event) => {
                            return _event.id ==  $scope.currentEvent.id;
                         })[0];
                         $log.debug('current event!!! =>', $scope.currentEvent);
                         $scope.changeEvent();
                    }
                }).catch(function () {
                    $log.debug('could not get event data.');
                });
            };

            /**
             * @function Handles when the event is changed
             */
            $scope.changeEvent = function changeEvent() {
                $log.debug('current event =>', $scope.currentEvent);

                LeadService.getDevicesByAccountId({
                    params: {
                        account_id: $scope.currentAccount.account_code,
                    }
                }).then(function(response) {
                    $scope.deviceCodes = response.data;
                }).catch(function () {
                    $log.debug('could not get devices.');
                });

            };

            $scope.parseMetaData = function(jsonString) {
                return JSON.parse(jsonString);
            };

            /**
             * @function Handles changing of meta data
             */
            $scope.changeMeta = function changeMeta() {
                $log.debug('current meta', $scope.currentMeta);
                $log.debug('scope =>', $scope);
            };

            /**
             * @function Handles when the device code is changed
             */
            $scope.changeDeviceCode = function changeDeviceCode() {};

        }
    ]);