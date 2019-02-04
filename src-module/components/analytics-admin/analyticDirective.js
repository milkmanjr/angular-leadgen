angular.module('angular-leadgen')
    .directive('leadgenAnalyticsTrack', ['$log', 'AnalyticService',
        function($log, AnalyticService) {

            return {
                restrict: 'A',
                link: function(scope, elem, attrs) {
                    elem.on('click', () => {
                        var payload = scope.$eval(attrs.leadgenAnalyticsTrack);

                        $log.debug('save click tracking => ', payload);

                        AnalyticService.save({
                            params: payload
                        });
                    });
                }
            };
        }
    ])