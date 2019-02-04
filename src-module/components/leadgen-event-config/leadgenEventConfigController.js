angular.module('angular-leadgen')
    .controller('LeadgenEventConfigController', ['$scope', 'ConfigService', '$log', 'LeadService',
        function ($scope, ConfigService, $log, LeadService) {

        var LeadgenConfig = new ConfigService({type: 'leadgen'});

        // setup array of values
        $scope.currentEvent;
        $scope.events = [];
        $scope.staff = [];
        $scope.ready = false;

        // grab the current leadgen config
        $scope.refresh = function () {
            $scope.ready = false;

            LeadgenConfig.get()
                .then((config) => {
                    $log.debug('all the config =>', config);

                    $scope.testEvent = config['event'] && config.event.name.match(/test/gi);
                    $scope.currentEvent = config['event'] || {};
                    $scope.events =  config.all_events || [];
                    $scope.staff = config.staff || [];
                    $scope.collection_method = config.collection_method;

                    // get the event data
                    // from the backend
                    return LeadService.getEventData({
                        params: {
                            account: config.account.account_code,
                            version: '1.0',
                            device_code: config.device.device_code,
                            application_code: config.application.application_code,
                            time: (new Date()).getTime()
                        }
                    });
                })
                .then(function(response) {
                    $scope.events = response.data && response.data.events_list && response.data.events_list.list ? response.data.events_list.list : [];
                    $scope.staff = response.data && response.data.staff_list && response.data.staff_list.list ? response.data.staff_list.list : [];
                    $scope.currentEvent =  $scope.events.filter((_event) => {
                        return _event.id == $scope.currentEvent.id;
                    })[0];

                    return LeadService.getApplicationValidation({
                        params: {
                            vehicle_make_name: LeadService.getConfig().vehicle_make || false
                        }
                    });
                }).then((response) => {
                    $scope.car_rules = response.data || {};

                    return LeadgenConfig.update({
                        all_events: $scope.events,
                        staff: $scope.staff,
                        event: $scope.currentEvent,
                        car_rules: $scope.car_rules,
                        vehicle_make: LeadService.getConfig('vehicle_make')
                    });
                }).catch(function () {
                    $log.debug('could not get refresh event data.');
                }).finally(()=>{
                    $scope.ready = true;
                    $log.debug('refreshed => ', $scope.currentEvent);
                });
        };
        $scope.refresh();

        /**
        * @function Saves the event
        */
        $scope.saveEvent = function () {

            // save the updated
            // event
            $scope.ready = false;

            // kick it off
            LeadgenConfig
                .update({
                    'event': $scope.currentEvent,
                    'vehicle_make': LeadService.getConfig('vehicle_make')
                })
                .then((response) => {
                    $log.debug('updates here =>', response);
                })
                .catch(function () {
                    $log.debug('could not get save event.');
                })
                .finally(() => {
                    $scope.testEvent = $scope.currentEvent && $scope.currentEvent.name.match(/test/gi);
                    $scope.ready = true;
                });
        };

    }]);