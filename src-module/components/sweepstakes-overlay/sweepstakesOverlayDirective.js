angular.module('angular-leadgen')
    .directive('leadgenSweepstakesOverlay', [
        '$uibModal', '$uibModalStack', '$sce', 'ConfigService',
        function($uibModal, $uibModalStack, $sce, ConfigService) {

            // instantiate a new
            // config service for leadgen
            // from here, we will get the sweepstakes rules from
            // meta data
            // grab the leadgen config
            // for the current app
            // and see if we have sweepstakes rules
            return {
                restrict: 'A',
                link: function($scope, elem, attrs) {
                    $scope.modalInstance = undefined;

                    // if this scope goes away
                    // make sure to close all the overlays
                    $scope.$on('$destroy', () => {
                        if($scope.modalInstance) $scope.modalInstance.close();
                    });

                    // show the overlay on any click
                    elem.on('click', () => {

                        var leadgenConfig = new ConfigService({
                                type: 'leadgen'
                            }),
                            sweepstakes_rules = '';

                        // kick off the promise cycle
                        // when we are done, store the sweepstakes rules
                        leadgenConfig.get()
                            .then((config) => {
                                sweepstakes_rules = config.sweepstakes_html
                            })
                            .finally(() => {
                                $scope.modalInstance = $uibModal.open({
                                    animation: $scope.animationsEnabled,
                                    templateUrl: 'sweepstakes-overlay.html',
                                    controller: 'SweepstakesOverlayController',
                                    resolve: {
                                        sweeps_html: function() {
                                            return $sce.trustAsHtml(sweepstakes_rules);
                                        }
                                    }
                                });
                            });

                    });

                }
            }
        }
    ]);