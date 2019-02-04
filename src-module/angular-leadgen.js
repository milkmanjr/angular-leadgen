
htmlCompile = require('angular-bind-html-compile');
chosen      = require('chosen/public/chosen.jquery.js');
require('angular-chosen-localytics');
require('angular-ui-bootstrap');
moment = require('moment');
require('angular-PubSub');
require('ng-table');

var alg_home_path = '',
    sweepstakes_base = '';

angular.module('angular-leadgen', [require('angular-sanitize'), 'angular-bind-html-compile', 'localytics.directives',require('angular-bootstrap-calendar'), 'ui.bootstrap', 'electangular', 'PubSub', 'ngTable'])
    .service('ConfigService', ['$q', '$log', '$window', 'PubSub', '$injector',
        function($q, $log, $window, PubSub, $injector) {
            var factory,
                fs = require('fs'),
                request = require('request'),
                sha1 = require('sha1'),
                Base64 = require('js-base64').Base64;

            factory = function(opts) {
                this.filename = opts.filename;
                this.home_path = opts.home_path  || alg_home_path || require('path').join(__dirname, '/');
                this.type = opts.type || 'standard';

                if (this.type == 'app') {
                    this.filename = 'app_config.json';
                }

                if (this.type == 'leadgen') {
                    this.filename = 'leadgen_config.json';
                }
            };

            factory.prototype.getBrochureRules = function (brand) {
                var deferred = $q.defer(),
                    LeadService = $injector.get('LeadService'),
                    brandMap = {
                        honda: 1,
                        acura: 2
                    };

                return LeadService.getFormRules()
                    .then((data) => {
                        var clean = data.data.filter((result) => {
                            return result.vehicle_make_id == brandMap[brand]
                        });
                        $log.debug('getting the car rules =>', clean);
                        return clean;
                    })

                return deferred.promise;
            }

            factory.prototype.save = function(data) {
                var deferred = $q.defer(),
                    sweepUrl,
                    _this = this,
                    writeToDisk = function(data) {
                        data.updated_time = (new Date()).getTime();
                        fs.writeFileSync(_this.home_path + '/' + _this.filename, JSON.stringify(data));
                        PubSub.publish(_this.type + '.configUpdate', {data: data});
                        deferred.resolve(true);
                    };

                try {
                    $log.debug('writing config to', _this.filename);

                    // convert meta data
                    // to a true JSON object
                    if (_this.type == 'leadgen' && data && data.event && typeof data.event.meta == 'string') {
                        $log.debug('converting meta_data to a real JSON object');
                        data.meta = {};
                        data.meta.meta_data = JSON.parse(Base64.decode(data.event.meta));
                    }

                    // download sweepstakes rules
                    // if there are sweepstakes rules
                    if (_this.type == 'leadgen' && data && data.meta && data.meta.meta_data && data.meta.meta_data.sweepstakes_rules) {
                        $log.debug('downloading sweeps rules from => ', data.meta.meta_data.sweepstakes_rules);
                        sweepUrl = data.meta.meta_data.sweepstakes_rules;

                        // if the url doesnt start with http(s)
                        // it is relative, so we need to prepend the leadgen host
                        if (!sweepUrl.match(/^http/gi)) {
                            sweepUrl = sweepstakes_base ? (sweepstakes_base + sweepUrl) : ('https://public.gpjconnect.com/' + (data.vehicle_make ? data.vehicle_make.toLowerCase() : '') + '/' + sweepUrl.replace(/^sweepstakes\//gi, 'sweepstakes_rules/'));
                            $log.debug('this is a relative url, we need to prepend the host, true uri =>', sweepUrl);
                        }

                        request({method: 'GET', url: sweepUrl, "rejectUnauthorized": false}, function(err, response, body) {
                            if (err) {

                                // we hit an error
                                // either this file doesnt exist or there was a
                                // network error. lets see if we have it stored locally.
                                _this.get()
                                    .then((currentConfig) => {
                                        $log.debug('there was an error, using old offline data to get rules');
                                        data.sweepstakes_html = currentConfig.all_sweepstakes_rules ? currentConfig.all_sweepstakes_rules[data.meta.meta_data.sweepstakes_rules] : '';
                                        data.b_cars = currentConfig.b_cars;
                                        writeToDisk(data);
                                    });
                            } else {
                                // we were able to fetch it. lets update it.
                                data.sweepstakes_html = body;

                                var carsDownload = data.b_cars;

                                _this.getBrochureRules(data.vehicle_make.toLowerCase())
                                    .then((cars) => {
                                        carsDownload = cars;
                                    })
                                    .finally(() => {
                                        data.b_cars = carsDownload;
                                        writeToDisk(data);
                                    })
                            }

                        });
                    } else {
                        writeToDisk(data);
                    }
                } catch (ex) {
                    deferred.reject(ex);
                }

                return deferred.promise;

            };

            /**
            * @function Downloads all sweepstakes and stores them in the event
            * we go offline.
            */
            factory.prototype.downloadSweepstakesRules = function (events) {
                var _this = this,
                    eventsCopy = events.slice(0),
                    deferred = $q.defer(),
                    all_sweepstakes_rules = {},
                    grabLatest;

                /**
                * function Private function that downloads meta
                * data sweepstakes html for each event
                */
                getOneEvent = function () {
                    if (eventsCopy.length == 0) {
                        deferred.resolve(all_sweepstakes_rules);
                    } else {
                        var currentEvent = eventsCopy.shift();
                        _this.downloadSweepstakesFromMeta(currentEvent.meta)
                            .then((response) => {
                                $log.debug('downloaded sweepstakes rule => "' + response.filename + "'");
                                all_sweepstakes_rules[response.filename] = response.body;
                            })
                            .catch(() => {
                                $log.error('error downloading sweeps rules')
                            })
                            .finally(()=> {
                                getOneEvent();
                            });
                    }
                };

                setTimeout(function () {

                    // if this isnt leadgen just exit
                    if (_this.type !== 'leadgen' || events.length == 0) {
                        deferred.resolve({});
                        return;
                    }

                    // start by getting one event
                    getOneEvent();

                }, 200);

                return deferred.promise;
            };

            factory.prototype.downloadSweepstakesFromMeta = function (meta) {
                var deferred = $q.defer(),
                    metaJSON = JSON.parse(Base64.decode(meta));

                $log.debug('trying to download sweeps for this => ', metaJSON);

                request({method: 'GET', url: metaJSON.sweepstakes_rules}, function (err, response, body) {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        deferred.resolve({'body': body, 'filename': metaJSON.sweepstakes_rules});
                    }
                });

                return deferred.promise;
            };

            /**
            * @function Updates the current object then saves it.
            */
            factory.prototype.update = function (updates) {
                var _this = this,
                    deferred = $q.defer();

                _this.get()
                    .then((response) => {
                        var new_object = $window.jQuery.extend(response || {}, updates);

                        // apply the updates
                        // then save
                        _this.save(new_object)
                            .then(()=> {
                                deferred.resolve();
                            })
                            .catch(()=> {
                                deferred.reject('Could not save updated config.');
                            })
                    })
                    .catch(()=>{
                        deferred.reject('Could not get current config.');
                    });

                return deferred.promise;
            };

            /**
            * @function Logs out a user
            * @returns {Promise}
            */
            factory.prototype.logout = function () {
                var _this = this,
                    deferred = $q.defer();

                // clearing the staff code
                // essentially logs the user out
                return _this.update({
                    staff_code: ''
                });
            };

            /**
            * @function Logs a user in
            * @param {String} opts.username The leadgen staff code
            * @param {String} opts.password The leadgen password [for the given staff code]
            * @returns {Promise}
            */
            factory.prototype.login = function(opts) {
                var _this = this,
                    deferred = $q.defer(),
                    success = false,
                    username = opts.username,
                    password = opts.password;

                // get just the staff
                // from the current config
                // then try and login
                _this.get()
                    .then((response) => {
                        // allow test login for all accounts.
                        if(username == 'test' && password == '1234') {
                            response.staff_code = 'test';
                            _this.save(response)
                                .then(() => {
                                    deferred.resolve();
                                });
                            success = true;
                            return;
                        }

                        // this method only works on
                        // "leadgen" type configs
                        if (!_this.type == 'leadgen' || !response.staff || response.staff.length == 0) {
                            deferred.reject();
                            return;
                        }

                        // kick things off
                        $log.debug('login attempt with =>', opts);

                        // cycle through all the usernames
                        // until we find a match
                        // then act on that match
                        for (var i = 0, length = response.staff.length; i < length; i++) {
                            var testUsername = response.staff[i].code;

                            if (testUsername === username) {
                                $log.debug('found username match');

                                if (password) {

                                    // now we test the password
                                    // concatenate the strings
                                    // and then sha1 encode it 1000 times.
                                    var input = response.staff[i].salt + password;
                                    for (var b = 0; b < 1000; b++) {
                                        input = sha1(input);
                                    }
                                    $log.debug('sha1 result =>', input);

                                    // finally check what leadgen has
                                    // if it matches, we are good to go
                                    // if it doesnt then we reject the login attempt.
                                    if (input == response.staff[i].password) {

                                        // save the staff code
                                        // to the leadgen config
                                        response.staff_code = response.staff[i].code;
                                        _this.save(response)
                                            .then(() => {
                                                deferred.resolve();
                                            });
                                        success = true;

                                    } else {
                                        deferred.reject('password didnt match');
                                    }

                                } else {

                                    // no password supplied
                                    // reject the login attempt
                                    deferred.reject('no password supplied');
                                }

                                break;
                            }
                        }

                        // if we made it here, it didnt work out
                        if (!success)
                            deferred.reject('no valid user found');
                    })
                    .catch((error) => {
                        deferred.reject(error);
                    });

                return deferred.promise;
            };

            factory.prototype.get = function(key) {
                var json,
                    deferred = $q.defer(),
                    _this = this;

                // attempt to load the config
                // from the filename from this config
                // if a key is passed, we will just load that
                // namespace.
                // If no key, we return the whole thing.
                $log.debug('loading config from',  _this.filename);
                try {
                    json = JSON.parse(fs.readFileSync(_this.home_path + '/' + _this.filename));

                    if (key)
                        deferred.resolve(json[key]);
                    else
                        deferred.resolve(json);
                } catch (ex) {
                    deferred.resolve({});
                }

                return deferred.promise;
            };

            return factory;
        }
    ])
/**
 * =========================
 * + Lead Service Directive +
 * -------------------------
 *
 * The template for the lead
 * service admin
 * =========================
 */
.directive('leadgenAdmin', [

    function() {
        return {
            restrict: 'E',
            templateUrl: './admin-template-merged.html'
        }
    }
])
/**
 * =========================
 * + Admin Controller +
 * -------------------------
 *
 * Everything for the
 * service admin
 * =========================
 */
.controller('AdminController', ['$scope', 'ConfigService', '$rootScope', 'LeadService',
    function($scope, ConfigService, $rootScope, LeadService) {
        $rootScope.leadgen_admin_pin = false;

        // get the config for the lead service
        // and see if leads are disabled.
        $scope.allPages = [];
        $scope.leadgen_enabled = (!LeadService.getConfig().disable_leads);
        $scope.packages_enabled = (!LeadService.getConfig().disable_packages);
        $scope.timeouts_enabled = (!LeadService.getConfig().disable_timeouts);
        $scope.boot_enabled = (!LeadService.getConfig().disable_autostart);

        // look for custom pages
        $scope.customTabs = LeadService.getConfig().custom_tabs || [];

        $scope.pinEnteredSuccessfully = function() {
            $rootScope.leadgen_admin_pin = true;
        };

        $scope.changePage = function(page) {
            $scope.currentPage = page;
            $scope.userInitiatedPageChange = true;
        };

        $scope.currentPage = "Leads";
    }
])
/**
 * =========================
 * + Lead Service Provider +
 * -------------------------
 *
 * Saves and sends leads.
 * =========================
 */
.provider('LeadService', function() {
    var _this = this,
        config = {
            home_path: require('path').join(__dirname, '/'),
            leadgen_remote_server: 'https://lg3.gpjconnect.com',
            brochure_remote_server: 'http://brochures.spinifex.io/app'
        };

    this.setConfig = function(new_config) {
        config = angular.extend(config, new_config);
        alg_home_path = config.home_path || '';
        sweepstakes_base = config.sweepstakes_base || '';
    };

    this.getConfig = function(key) {
        if (key) {
            return config[key] || '';
        }

        return config;
    }

    this.$get = ['$q', '$http', '$log', 'ConfigService', '$timeout', '$rootScope',
        function($q, $http, $log, ConfigService, $timeout, $rootScope) {
            var self = {},

                // datastore (mongodb-esque)
                Datastore = require('nedb'),

                // local json for storing
                // our leadgen configuration
                // sweepstakes html, etc.
                LeadgenConfig = new ConfigService({
                    type: 'leadgen',
                    home_path: _this.getConfig('home_path'),
                    filename: 'leadgen_config.json'
                }),

                // database we will store the
                // leads into
                db = new Datastore({
                    filename: _this.getConfig('home_path') + '/leads.db',
                    autoload: true
                });

            /**
             * @namespace All the email domains we include by default
             */
            self.emailDomains = [
                "@gmail.com",
                "@icloud.com",
                "@hotmail.com",
                "@outlook.com",
                "@yahoo.com",
                "@aol.com",
                "@att.net",
                "@bellsouth.net",
                "@charter.net",
                "@comcast.net",
                "@cox.net",
                "@earthlink.net",
                "@live.com",
                "@me.com",
                "@msn.com",
                "@roadrunner.com",
                "@sbcglobal.net",
                "@verizon.net",
                ".com",
                ".net",
                ".edu"
            ];

            /**
             * @function Returns the current config
             * @returns {Object}
             */
            self.getConfig = function(key) {
                return (key) ? _this.getConfig(key) : _this.getConfig();
            };

            self.setConfig = function(new_config) {
                return _this.setConfig(new_config);
            }

            /**
             * @function Sends an api request
             * @param {String} url The path to hit
             * @param {Object} opts
             * @returns {Promise}
             */
            self.apiGet = function apiUrl(url, opts) {
                var opts = opts || {},
                    deferred = $q.defer();

                var server = opts.configName ? opts.configName : 'leadgen_remote_server'

                $http[opts.method == 'POST' ? 'post' : 'get'](_this.getConfig(server) + url + (opts.method != 'POST' && opts.params ? ('?' + jQuery.param(opts.params)) : opts.raw ? opts.raw : ''), opts.method == 'POST' ? opts.params : '')
                    .then(response => deferred.resolve(response.data), deferred.reject);

                return deferred.promise;
            };

            /**
             * @namespace Tells us if we are currently syncing or not
             */
            self.syncing = false;

            /**
             * @function Tries to get all the application data;
             * @param {Object} opts
             * @param {Object} opts.params  Key-value object pair that'll get sent up to leadgen
             * @returns {Promise}
             */
            self.getAccounts = function api(opts) {
                if (self.getConfig().staticAccounts) {
                    var deferred = $q.defer();
                    $timeout(() => {
                        deferred.resolve({
                            data: self.getConfig().staticAccounts
                        });
                    }, 50);
                    return deferred.promise;
                }

                return self.apiGet('/api/account/getAccounts', opts);
            };

            /**
             * @function Gets applications by account id
             * @param {Object} opts
             * @param {Object} opts.params  Key-value object pair that'll get sent up to leadgen
             * @returns {Promise}
             */
            self.getApplicationsByAccountId = function(opts) {
                if (self.getConfig().staticApplications) {
                    var deferred = $q.defer();
                    $timeout(() => {
                        deferred.resolve({
                            data: self.getConfig().staticApplications
                        });
                    }, 50);
                    return deferred.promise;
                }

                return self.apiGet('/api/admin/application/getApplicationsByAccountId', opts);
            };

            /**
            * @function Gest the rules for showing certain cars and their digital vs physical brochures
            */
            self.getApplicationValidation = function (opts) {
                var deferred = $q.defer();

                if (!opts.params.vehicle_make_name) {
                    setTimeout(function () {
                        deferred.resolve({});
                    }, 200);
                    return deferred.promise;
                } else {
                    return self.apiGet('/api/admin/application/getApplicationValidation', opts);
                }
            };

            /**
             * @function Gets events by application code
             * @param {Object} opts
             * @param {Object} opts.params  Key-value object pair that'll get sent up to leadgen
             * @returns {Promise}
             */
            self.getEventsByApplicationCode = function(opts) {
                return self.apiGet('/api/admin/event/getEventsByApplicationCode', opts);
            };

            /**
             * @function Gets events by account code
             * @param {Object} opts
             * @param {Object} opts.params  Key-value object pair that'll get sent up to leadgen
             * @returns {Promise}
             */
            self.getEventsByAccountCode = function(opts) {
                return self.apiGet('/api/admin/event/getEventsByAccountCode', opts);
            };

            /**
             * @function Get event data
             * @params {String} opts.device_code Device Code
             * @params {String} opts.application_code Application Code
             * @params {String} opts.account Account code
             * @params {String} opts.version Version, defaults to 1
             * @retursn {Promise}
             */
            self.getEventData = function(opts) {
                return self.apiGet('/api/content/', opts);
            };

            /**
             * @function Gets devices by account id
             * @param {Object} opts
             * @param {Object} opts.params  Key-value object pair that'll get sent up to leadgen
             * @returns {Promise}
             */
            self.getDevicesByAccountId = function(opts) {
                return self.apiGet('/api/admin/device/getDevicesByAccountId', opts);
            };

            /**
            * @function Gets the rules for stuff
            */
            self.getFormRules = function (opts) {
                return self.apiGet('/',
                  jQuery.extend(
                    {
                      configName: 'brochure_remote_server',
                      method: 'get',
                      params: {
                        action: 'getValidationData',
                        type: 'vehicle'
                      }
                    },
                    opts
                  )
                )
            }

            /**
             * @function Gets formats by application code
             * @param {Object} opts
             * @param {Object} opts.params  Key-value object pair that'll get sent up to leadgen
             * @returns {Promise}
             */
            self.getFormatByApplicationCode = function(opts) {
                return self.apiGet('/api/admin/format/getFormatByApplicationCode', opts);
            };

            /**
             * @function Gets all the  leads from the local db
             * @returns {Promise}
             */
            self.getLocalLeads = function() {
                var deferred = $q.defer();

                db.find({
                    synced: false
                }).sort({
                    captime: -1
                }).exec((err, docs) => {
                    if (err) {
                        deferred.reject(err);
                        return;
                    }
                    deferred.resolve(docs);
                });

                return deferred.promise;
            };

            /**
             * @function Marks a lead as synced
             * @returns {Promise}
             */
            self.markAsSynced = function(opts) {
                var deferred = $q.defer();

                db.update(opts, {
                    $set: {
                        synced: true
                    }
                }, function(err, doc) {
                    if (err) {
                        deferred.reject(err);
                        return;
                    }

                    deferred.resolve();
                });

                return deferred.promise;
            };

            /**
             * @function Attemps to sync one lead.
             * @returns {Promise}
             */
            self.syncOneLead = function() {
                var deferred = $q.defer();
                self.syncing = true;
                db.find({
                    synced: false
                }).sort({
                    captime: 1
                }).limit(1).exec((err, docs) => {

                    // there was an error
                    if (err) {
                        deferred.reject(err);
                        return;
                    }

                    // all done, no more
                    // unsynced leads
                    if (!docs || docs.length == 0) {
                        deferred.resolve({
                            no_more: true
                        });
                        return;
                    }

                    // send the lead
                    self.apiGet('/api/capture/', {
                        raw: '?' + docs[0].params
                    })
                        .then(function(response) {
                            if (response.success && response.success == true) {
                                self.markAsSynced({
                                    _id: docs[0]._id,
                                    params: docs[0].params
                                })
                                    .then(function() {
                                        deferred.resolve(response);
                                    })
                                    .catch(function() {
                                        deferred.reject();
                                    })
                                    .finally(function() {
                                        self.syncing = false;
                                    });
                            }
                        })
                        .catch(deferred.reject)
                        .finally(function() {
                            self.syncing = false;
                        });

                });

                return deferred.promise;
            };

            /**
             * @function Syncs all the leads
             */
            self.syncAllLeads = function() {
                var deferred = $q.defer();

                var run = function() {
                    self
                        .syncOneLead()
                        .then(function(response) {
                            if (response.no_more) {
                                deferred.resolve();
                            } else {
                                // if there are more,
                                // sync another lead
                                run();
                            }
                            self.messageAdmin();
                        })
                        .catch(deferred.reject);
                };

                // kick things off by syncing one lead
                run();

                return deferred.promise;
            };

            /**
            * @function Gets the counts of leads by month.
            */
            self.getLeadsByMonth = function (obj) {
                var date     = new Date(),
                    deferred = $q.defer(),
                    year     = obj.year || date.getFullYear(),
                    month    = obj.month || date.getMonth() + 1;

                if (month < 10) {
                    month = '0' + month;
                }

                db.find({
                    captime: new RegExp('^' + year + '\\-' + month)
                },function (err, docs) {
                    deferred.resolve(self.breakdownMonthByDay(docs));
                });

                return deferred.promise;
            };

            /**
            * @functions Takes each lead that matches and
            * breaks it down by day
            */
            self.breakdownMonthByDay = function (array) {
                var days = {};

                for (var i = 0, length = array.length; i<length; i++) {

                    var date      = moment(array[i].captime).format('D') + '',
                        eventCode = array[i].event_code;

                    // increment the total count for the day.
                    days[date]        = days[date] || {};
                    days[date].total  = days[date].total ? (days[date].total + 1) : 1;

                    if (!days[date].start) {
                        days[date].start = moment(array[i].captime).startOf('day').toDate();
                        days[date].end   = moment(array[i].captime).endOf('day').toDate();
                    }

                    // increment the event specific count for the day.
                    days[date].events            = days[date].events || {};
                    days[date].events[eventCode] = days[date].events[eventCode] ? (days[date].events[eventCode] + 1) : 1;

                    // add the individual leads
                    days[date].leads             = days[date].leads || [];
                    days[date].leads.push(array[i]);
                }

                return days;
            };

            /**
             * @function Gets the count of local leads from the local db
             */
            self.getLocalLeadCounts = function() {
                var counts = {
                        synced: 0,
                        unsynced: 0,
                        byEvent: {}
                    },
                    deferred = $q.defer();

                // start by
                // counting the unsynced leads
                db.find({
                    synced: false
                }, function(err, unsynced_docs) {

                    if (err) {
                        deferred.reject(err);
                        return;
                    }

                    unsynced_docs.forEach(function(doc) {
                        counts.unsynced = counts.unsynced || 0;
                        counts.unsynced++;

                        counts.byEvent[doc.event_code] = counts.byEvent[doc.event_code] || {};
                        counts.byEvent[doc.event_code]['event_code'] = doc.event_code;
                        counts.byEvent[doc.event_code]['unsynced'] = counts.byEvent[doc.event_code]['unsynced'] || 0;
                        counts.byEvent[doc.event_code]['unsynced']++;
                    });

                    // finally, get a count of the synced
                    // leads
                    db.find({
                        synced: true
                    }, function(err, synced_docs) {
                        if (err) {
                            deferred.reject(err);
                            return;
                        }

                        synced_docs.forEach(function(doc) {
                            counts.synced = counts.synced || 0;
                            counts.synced++;

                            counts.byEvent[doc.event_code] = counts.byEvent[doc.event_code] || {};
                            counts.byEvent[doc.event_code]['event_code'] = doc.event_code;
                            counts.byEvent[doc.event_code]['synced'] = counts.byEvent[doc.event_code]['synced'] || 0;
                            counts.byEvent[doc.event_code]['synced']++;
                        });
                        // resolve
                        deferred.resolve(counts);
                    });

                });

                return deferred.promise;
            };

            /**
            * @function Tells the admin something happened in leadgen
            */
            self.messageAdmin = function () {
                $rootScope.$broadcast('Leadgen::refreshAdminLeads');
            };

            /**
             * @function Tries to save a lead, which will ultimately go up to leadgen
             * @param opts {Object}
             * @param opts.params {Object} Key value object pair that'll get sent up to leadgen
             * @returns {Promise}
             */
            self.save = function(opts) {
                var deferred = $q.defer();

                LeadgenConfig.get()
                    .then(function(appConfig) {
                        opts.params = opts.params || {};

                        var captime = moment().format("YYYY-MM-DD HH:mm:ss");

                        // leadgen specific
                        // fields that are needed to submit
                        // a successful lead!
                        opts.params = jQuery.extend(opts.params, {
                            _version: '1.0',
                            collection_method: appConfig.collection_method == 'wheelstand' || appConfig.collection_method == 'kiosk' ? appConfig.collection_method : appConfig.customCmethod,
                            customCmethod: appConfig.customCmethod,
                            _account: appConfig.account.account_code,
                            _application_code: appConfig.application.application_code,
                            _device_code: appConfig.device.device_code,
                            _event_code: appConfig.event.code || appConfig.event.event_code,
                            _staff_code: appConfig.staff_code ? appConfig.staff_code : 'staff3'
                        });

                        var meta_data = appConfig.meta.meta_data || {};
                        // delete app_config if it is there.
                        if (meta_data && meta_data.app_config && meta_data.hasOwnProperty(app_config)) delete meta_data.app_config;

                        // merge the metadata in
                        opts.params = jQuery.extend(opts.params, meta_data);

                        // save the leads in the table
                        db.insert({
                            event_code: opts.params._event_code,
                            created: (new Date()).getTime(),
                            synced: false,
                            captime: captime,
                            params_obj: opts.params,
                            params: jQuery.param(opts.params)
                        }, function(err, doc) {
                            if (err) {
                                deferred.reject(err);
                                return;
                            }

                            self.messageAdmin();
                            deferred.resolve(doc);
                        });
                    })
                    .catch(deferred.reject);

                return deferred.promise;
            };

            return self;
        }
    ];
});