angular.module('angular-leadgen').directive('forceOpenKeyboard', ['$log', function ($log) {

    const {ipcRenderer} = require('electron');

    return {
        restrict: 'A',
        link: function (scope, elem, attrs) {

            /**
            * @function Opens the keyboard on focus
            */
            elem.on('focus click', () => {
                ipcRenderer.send('electron-msg', {
                    command: 'open-keyboard'
                });
            });

            /**
            * @function Closes the keyboard on blur
            */
            elem.on('blur', () => {
                ipcRenderer.send('electron-msg', {
                    command: 'close-keyboard'
                });
            });

        }
    };

}])