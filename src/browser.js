var ipcRenderer = require('electron').ipcRenderer;


process.once('loaded', function () {
  //alert('sample')

  ipcRenderer.on('reset', function (event, data) {
    console.log('reseting cookies');

    ipcRenderer.send('set-reset-cookies', false)

    var name = 'zipcode'

    setTimeout(function () {
      var pathBits = location.pathname.split('/');
      var pathCurrent = ' path=';

      // do a simple pathless delete first.
      document.cookie = name + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT;';

      for (var i = 0; i < pathBits.length; i++) {
          pathCurrent += ((pathCurrent.substr(-1) != '/') ? '/' : '') + pathBits[i];
          document.cookie = name + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT;' + pathCurrent + ';';
      }

      $('body').remove()

      location.reload(true);
    }, 150);

  });

  setTimeout(() => {
    console.log('checking if we should reset')
    ipcRenderer.send('should-reset-cookies');
  }, 200);
});