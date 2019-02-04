(function () {
    var electron = require('electron');
    angular.module('angular-leadgen')
        .directive('urlOpener', ['$log', '$rootScope', 'LeadService', '$injector', function ($log, $rootScope, LeadService, $injector) {
            return {
                restrict: 'A',
                link: function (s,e,a){
                    e.bind('click', function () {
                        $log.debug('opening url', a.urlOpener);

                        // if (!$rootScope.online) {
                        //     $log.debug('not opening url, offline');
                        //     LeadService.getConfig().browser_offline_callback && LeadService.getConfig().browser_offline_callback($injector);
                        //     return;
                        // }

                        electron.ipcRenderer.send('open-url', {url: a.urlOpener});
                    })
                }
            }
        }])
})();