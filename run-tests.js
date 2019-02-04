exports.config = {
    directConnection: true,
    capabilities: {
        browserName: 'chrome',
        chromeOptions: {
            binary: './node_modules/.bin/electron',
            args: ['--test-type=webdriver', 'app=./build/main.js']
        }
    },
    //seleniumAddress: 'http://localhost:4444/wd/hub',
    specs: ['./spec/**/*-spec.js'],
    onPrepare: function() {
        var SpecReporter = require('jasmine-spec-reporter');
        // add jasmine spec reporter
        jasmine.getEnv().addReporter(new SpecReporter({
            displayStacktrace: 'none'
        }));
    },
    jasmineNodeOpts: {
        showColors: true, // Use colors in the command line report.
        isVerbose: true,
        includeStackTrace: false,
        print: function() {},
        defaultTimeoutInterval: 360000,

        // If true, print timestamps for failures
        showTiming: false,

        // Print failures in real time.
        realtimeFailure: false
    }
};