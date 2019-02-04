angular.module("angular-leadgen")
    .controller('AdminAnalyticsController', ['$scope', 'AnalyticService',
        function($scope, AnalyticService) {

            $scope.ready = false;
            $scope.error = false;
            $scope.syncing = false;
            $scope.analytics = [];
            $scope.analyticCounts = {};

            /**
             * @function Grabs the leads in the local database
             */
            $scope.getLocalAnalytics = function() {
                $scope.ready = false;

                // get the local db analytics
                // then get the counts
                AnalyticService.getLocalAnalytics()
                    .then(function(analytics) {
                        $scope.analytics = analytics;
                        return AnalyticService.getLocalAnalyticCounts();
                    })
                    .then(function(counts) {
                        $scope.analyticCounts = counts;
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

                // attempt to sync the analytics
                // when we are done, refresh the list
                // of local analytics.
                AnalyticService.syncAllAnalytics()
                    .then(function(response) {

                    })
                    .catch(function() {
                        $scope.error = true;
                    })
                    .finally(function() {
                        $scope.ready = true;
                        $scope.syncing = false;

                        // get the analytics again
                        $scope.getLocalAnalytics();
                    });

            };

            // kick things off by getting
            // the analytics in the database
            $scope.getLocalAnalytics();
        }
    ]);