angular.module("angular-leadgen")
    .controller('AdminLeadsController', ['$scope', 'LeadService', '$rootScope',
        function($scope, LeadService, $rootScope) {

            $scope.ready = false;
            $scope.error = false;
            $scope.syncing = false;
            $scope.leads = [];
            $scope.leadCounts = {};

            /**
             * @function Grabs the leads in the local database
             */
            $scope.getLocalLeads = function() {
                $scope.ready = false;

                // get the local db leads
                // then get the counts
                LeadService.getLocalLeads()
                    .then(function(leads) {
                        $scope.leads = leads;
                        return LeadService.getLocalLeadCounts();
                    })
                    .then(function(counts) {
                        $scope.leadCounts = counts;
                    })
                    .finally(function() {
                        $scope.ready = true;
                    });
            };

            /**
             * @function Tries to do a manual sync
             */
            $scope.manualSync = function() {
                $scope.ready = false;
                $scope.error = false;
                $scope.syncing = true;
                $scope.currentSyncLead = '';

                // attempt to sync the leads
                // when we are done, refresh the list
                // of local leads.
                LeadService.syncAllLeads()
                    .then(function(response) {

                    })
                    .catch(function() {
                        $scope.error = true;
                    })
                    .finally(function() {
                        $scope.ready = true;
                        $scope.syncing = false;

                        // get the leads again
                        $scope.getLocalLeads();
                    });

            };

            // kick things off by getting
            // the leads in the database
            $scope.getLocalLeads();
            $rootScope.$on('Leadgen::refreshAdminLeads', () => {
                 $scope.getLocalLeads();
            });
        }
    ]);