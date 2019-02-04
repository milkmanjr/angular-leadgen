var mainProcess = {};

mainProcess.browserOpen = false;

mainProcess.setup = function (opts) {

    // bind the appropriate
    // things the ipc process
    if (opts.ipc) {
        opts.ipc.on('get-process-args', (event, data) => {
            event.sender.send('process-args', require('yargs').parse(process.argv.slice(1)));
        });

        // find the leadgen json file
        // and change the collection_method
        var args = require('yargs').parse(process.argv.slice(1));
        if (args.force_wheelstand || args.force_kiosk) {
          mainProcess.updateJSON(require('path').join(process.cwd(), args.force_wheelstand || args.force_kiosk), {
            collection_method: args.force_wheelstand ? 'wheelstand' : 'kiosk'
          })
          .then(() => {
            console.log('updated leadgen config');
          })
          .catch((err) => {
            console.log('error updating leadgen config =>', err);
          });
        }

        if (!opts.skip_browser) mainProcess.setupBrowser(opts);
    }
};

mainProcess.updateJSON = function (path, changes) {
  var fs = require('fs'),
    file = require(path);

  return new Promise((resolve, reject) => {
    fs.writeFile(path, JSON.stringify(Object.assign({}, file, changes)), function (err) {
      if (err) {
        console.error('could not write json file');
        reject(err)
        return
      }

      resolve();
    });
  });
}

mainProcess.setupBrowser = function (opts) {
    let ipc = opts.ipc,
        mainRendererIpc,
        resetCookies = false,
        mainWindow = opts.mainWindow,
        closerWindow,
        externalWindow,
        should_reset = false,
        electron = require('electron');

    ipc.on('ping-activity', function (event) {
        mainWindow.webContents.send('ping-activity');
    });

    ipc.on('set-reset-cookies', function (event, data) {
      resetCookies = data;
    });

    ipc.on('should-reset-cookies', function (event) {
      if (resetCookies == true) event.sender.send('reset');
    });

    ipc.on('open-url', (event, obj) => {
          // only do things if we think the browser
          // is in the closed state
          if (mainProcess.browserOpen) {
              return false;
          }
          mainProcess.browserOpen = true;

          mainRendererIpc = event.sender;
          mainRendererIpc.send('browser-open');

          // create a new window
          // and load the url we want to go to.
          externalWindow = new electron.BrowserWindow({
              frame: false,
              height: opts.height || (mainWindow.getBounds().height - 200),
              width: opts.width || (mainWindow.getBounds().width - 200),
              movable: false,
              resizable: false,
              minimizable: false,
              fullscreenable: false,
              alwaysOnTop: true,
              webPreferences: {
                  nodeIntegration: true,
                  preload: opts.preload ? opts.preload : undefined,
                  // webSecurity: false,
                  // contextIsolation: true,
                  // allowRunningInsecureContent: true
              }
          });

          console.log('trying to open =>', opts.preload ? opts.preload : undefined);

          externalWindow.loadURL(obj.url, {
              userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36'
          });

          externalWindow.webContents.enableDeviceEmulation({
              screenPosition: 'desktop'
          });

          externalWindow.on('closed', () => {
              externalWindow = null;
          })

          if (opts.dev_mode) {
              externalWindow.webContents.openDevTools();
          }

          // create a new window
          // whose only job is to close the browswer window
          closerWindow = new electron.BrowserWindow({
              frame: false,
              width: 50,
              height: 50,
              x: opts.mainWindow.getBounds().x + opts.mainWindow.getBounds().width - 100,
              y: opts.mainWindow.getBounds().y + 100,
              alwaysOnTop: true,
              minimizable: false,
              transparent: false,
              hasShadow: false,
              resizable: false,
              fullscreenable: false,
              movable: false,
              webPreferences: {
                // webSecurity: false,
                // allowRunningInsecureContent: true
              }
          });
          closerWindow.loadURL(`file://${__dirname}/dist-module/close_browser.html`);
          closerWindow.on('closed', () => {
              closerWindow = null;
          });
      });

    ipc.on('close-browser', (event, obj) => {
      // close the closer window
      // and the external window
      if (!mainProcess.browserOpen) {
          return;
      }

      mainProcess.browserOpen = false;

      setTimeout(() => {
          mainRendererIpc.send('browser-closed');
          closerWindow && closerWindow.destroy();
          externalWindow && externalWindow.destroy();
      }, 200);
  });

};



module.exports = mainProcess;