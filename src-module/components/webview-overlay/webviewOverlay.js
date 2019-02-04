angular.module('angular-leadgen')
  .controller('AdminWebviewOverlay', ['$scope', '$log', function ($scope, $log) {
    var vm = this,
        electron = require('electron');

    /**
    * @notes
    */
    vm.show_webview = false;

    /**
    * @function Close webview
    */
    vm.closeWebview = function () {
        electron.ipcRenderer.send('close-browser');
    }

    /**
    * @function Hides the webview
    */
    vm.hideWebview = function () {
       vm.show_webview = false;
       $log.debug('webview should be closed.')
       $scope.$apply();
    }

    /**
    * @function Shows the webview
    */
    vm.showWebview = function () {
       vm.show_webview = true;
       $log.debug('webview is open.')
       $scope.$apply();
    }

    electron.ipcRenderer.on('browser-open', function () {
      vm.showWebview()
    })
    electron.ipcRenderer.on('browser-closed', function () {
      vm.hideWebview()
    })

    $scope.$on('$destroy', function () {
      electron.ipcRenderer.removeListener('browser-open', vm.showWebview)
      electron.ipcRenderer.removeListener('browser-closed', vm.hideWebview)
    });

  }]);