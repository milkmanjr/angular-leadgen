'use strict';
const electron = require('electron');
const app = electron.app;
const isDev = process.env.NODE_ENV === 'development';
const BrowserWindow = electron.BrowserWindow;
// const electronLocalshortcut = require('electron-localshortcut');
const {
    ipcMain
} = require('electron');

// we need a reference to this object the entire time this application runs
let mainWindow;

function createWindow() {
    // default the process env to production
    if (process.env.NODE_ENV === '') {
        process.env.NODE_ENV = 'production';
    }

    let browserAttribs = {
        width: 800,
        height: 600
    };

    if (!isDev) {
        browserAttribs.fullscreen = true;
        browserAttribs.kiosk = true;
    }

    mainWindow = new BrowserWindow(browserAttribs);
    mainWindow.loadURL(`file://${__dirname}/index.html`);


    mainWindow.on('closed', function() {
        mainWindow = null;
    });

    if (isDev) {
        mainWindow.openDevTools({
            detach: true
        });
    }

    // angular leadgen
    // required main process
    // setup
    require('../main-process')
        .setup({
            mainWindow: mainWindow,
            preload: require('path').join(__dirname, '../src/browser.js'),
            dev_mode: true,
            ipc: ipcMain});

}

app.on('ready', createWindow);
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('db-request-refresh', () => {
    console.log('db refresh requested');
});


ipcMain.on('electron-msg', (event, msg) => {
    if (msg.command == 'quit') {
        //runBat(START_BAT);

        setTimeout(() => {
            app.exit(0);
        }, 2000);
     } else {
        console.log('got a message =>', msg);
     }

});

app.on('activate', function() {
    if (mainWindow === null) {
        createWindow();
    }
});

ipcMain.on('online-status-changed', (event, status) => {
    console.log(event, status);
});