angular.module('angular-leadgen')
    .directive('monroneyOverlay', ['ConfigService', '$uibModal', function (ConfigService, $uibModal) {
        return {
            restrict: 'A',
            link: (scope, elem, attrs) => {
                var modal,
                    AppConfig = new ConfigService({type: 'app'}),
                    baseDir = 'file://' + require('path').join(__dirname, '../../../');

                elem.on('click', () => {
                    AppConfig.get()
                        .then((config) => {
                            modal = $uibModal.open({
                                templateUrl: 'moroney.html',
                                windowClass: 'monroney-modal',
                                controllerAs: 'vm',
                                controller: 'MonroneyModalController'
                            });
                    });
                });

            }
        }
    }]);

