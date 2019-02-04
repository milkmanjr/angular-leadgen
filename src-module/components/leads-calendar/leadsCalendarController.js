angular.module('angular-leadgen')
    .controller('LeadsCalendarController', ['LeadService', 'NgTableParams', '$log', function(LeadService, NgTableParams, $log) {
        let vm = this;

        vm.events       = [];
        vm.calendarView = 'month';
        vm.viewDate     = new Date();
        vm.selectedDate = new Date();
        vm.dateInfo     = {};
        vm.leads        = [];
        vm.dayMode      = false;

        /**
        * @function Gets the lead date when the date is changed.
        */
        vm.dateChanged = () => {
            LeadService.getLeadsByMonth({
                year: vm.viewDate.getFullYear(),
                month: (vm.viewDate.getMonth() + 1)
              })
                .then((response) => {
                    vm.dateInfo = response;
                    vm.updateCalendar();
                  });
          };

        /**
        * @function Updates the calendar
        */
        vm.updateCalendar = () => {
            vm.events = [];
            if (Object.keys(vm.dateInfo).length) {
              for (var x in vm.dateInfo) {
                vm.events.push({
                    startsAt: vm.dateInfo[x].start,
                    endsAt:   vm.dateInfo[x].end,
                    title: vm.dateInfo[x]
                  });
              }
            }
          };

        /**
        * @function When the timespan is clicked, load the leads
        * for that specific day
        */
        vm.onTimespanClick = (date) => {
            vm.dayMode      = true;
            vm.selectedDate = moment(date);
            vm.leads        = vm.dateInfo[vm.selectedDate.format('D')] ? vm.dateInfo[vm.selectedDate.format('D')].leads : [];
            vm.tableParams  = new NgTableParams({}, {
                dataset: vm.leads
              });
          };

        /**
        * @function Triggers a date change when the
        * view first loads.
        */
        vm.init = () => {
            vm.dateChanged();
          };

        vm.init();

      }]);
