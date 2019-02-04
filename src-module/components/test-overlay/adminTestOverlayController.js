angular.module('angular-leadgen')
  .controller('AdminTestOverlayController', ['$scope', 'ConfigService', 'PubSub', '$log',
    function ($scope, ConfigService, PubSub, $log) {
      var vm = this,
        leadgenConfigSubscriber,
        LeadService = new ConfigService({type: 'leadgen'});

      vm.overlayVisible = true;

      /**
      * @function Determines whether or not to show the
      * test mode overlay.
      */
      vm.showOverlay = function (show) {
        vm.overlayVisible = show || false;
      }

      /**
      * @function Gets the staff code. Figure it out by
      * cmoparing the staff_code == 'test'
      */
      vm.getStaffCode = function (updates) {

        vm.showOverlay(true);

        if (updates && updates.data) {
          vm.is_test = updates.data.staff_code == 'test' || updates.data.event.name.match(/test/gi);
          return;
        }

        LeadService.get()
          .then((config) => {
            vm.is_test = config.staff_code == 'test' || config.event.name.match(/test/gi);
            $log.debug('get config data =>', config);
          });
      };
      vm.getStaffCode();

      leadgenConfigSubscriber = PubSub.subscribe('leadgen.configUpdate', (updates) => {
          vm.getStaffCode(updates);
      });
}]);