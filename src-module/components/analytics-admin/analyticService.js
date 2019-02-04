angular.module('angular-leadgen')
    .provider('AnalyticService', function() {
        var _this = this,
            config = {
                leadgen_remote_server: 'https://lg3.gpjconnect.com',
            };

        this.setConfig = function(new_config) {
            config = angular.extend(config, new_config);
        };

        this.getConfig = function(key) {
            if (key) {
                return config[key] || '';
            }

            return config;
        }

        this.$get = ['$q', '$http', '$log', 'ConfigService',
            function($q, $http, $log, ConfigService) {
                var self = {},
                    uuid = require('uuid'),
                    sha1 = require('sha1'),

                    // datastore (mongodb-esque)
                    Datastore = require('nedb'),

                    // local json for storing
                    // our leadgen configuration
                    // sweepstakes html, etc.
                    LeadgenConfig = new ConfigService({
                        type: 'leadgen'
                    }),

                    // database we will store the
                    // leads into
                    db = new Datastore({
                        filename: LeadgenConfig.home_path + '/analytics.db',
                        autoload: true
                    });

                // set initial uuid
                self.init = function() {
                    self.generateUUID();
                    $log.debug('Analytics Service started, UUID =>', self.uuid);
                };

                /**
                 * @function Regenerations a new uuid
                 */
                self.generateUUID = function() {
                    self.uuid = sha1(uuid.v1() + uuid.v4());
                };

                /**
                 * @function Returns the current config
                 * @returns {Object}
                 */
                self.getConfig = function() {
                    return _this.getConfig();
                };

                /**
                 * @function Changes the UUID
                 */
                self.changeUniqueId = function() {
                    self.generateUUID();
                    $log.debug('changed the UUID due to inactivity, new UUID => ', self.uuid);
                };

                /**
                 * @function Sends an api request
                 * @param {String} url The path to hit
                 * @param {Object} opts
                 * @returns {Promise}
                 */
                self.apiGet = function apiUrl(url, opts) {
                    var opts = opts || {},
                        deferred = $q.defer();

                    $http[opts.method == 'POST' ? 'post' : 'get'](_this.getConfig('leadgen_remote_server') + url + (opts.method != 'POST' && opts.params ? ('?' + jQuery.param(opts.params)) : opts.raw ? opts.raw : ''), opts.method == 'POST' ? opts.params : '')
                        .then(response => deferred.resolve(response.data), deferred.reject);

                    return deferred.promise;

                };

                /**
                 * @namespace Tells us if we are currently syncing or not
                 */
                self.syncing = false;

                /**
                 * @function Gets all the  leads from the local db
                 * @returns {Promise}
                 */
                self.getLocalAnalytics = function() {
                    var deferred = $q.defer();

                    db.find({
                        synced: false
                    }).sort({
                        captime: -1
                    }).limit(5)
                        .exec((err, docs) => {
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
                 * @function Attemps to sync one analytic.
                 * @returns {Promise}
                 */
                self.syncOneAnalytic = function() {
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

                        // send the analytic
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
                self.syncAllAnalytics = function() {
                    var deferred = $q.defer();

                    var run = function() {
                        self
                            .syncOneAnalytic()
                            .then(function(response) {
                                if (response.no_more) {
                                    deferred.resolve();
                                } else {
                                    // if there are more,
                                    // sync another lead
                                    run();
                                }
                            })
                            .catch(deferred.reject);
                    };

                    // kick things off by syncing one lead
                    run();

                    return deferred.promise;
                };

                /**
                 * @function Gets the count of local leads from the local db
                 */
                self.getLocalAnalyticCounts = function() {
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
                 * @function Tries to save an analytic entry, which will ultimately go up to leadgen??
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
                            var meta_data = appConfig.meta && appConfig.meta.meta_data ? appConfig.meta.meta_data : {};

                            // let leadgen know this is an analytics
                            // request
                            if (meta_data.analytics_identifier) {
                                opts.params[meta_data.analytics_identifier] = "";
                            }

                            // delete app_config if it is there.
                            if (meta_data && meta_data.app_config && meta_data.hasOwnProperty(app_config)) delete meta_data.app_config;

                            // merge the metadata in
                            opts.params = jQuery.extend(opts.params, meta_data);

                            // leadgen specific
                            // fields that are needed to submit
                            // a successful lead!
                            opts.params = jQuery.extend(opts.params, {
                                _version: '1.0',
                                id: self.uuid,
                                captime: captime,
                                _account: appConfig.account.account_code,
                                _application_code: meta_data.analytics_application_code,
                                _device_code: appConfig.device.device_code,
                                _event_code: appConfig.event.code || appConfig.event.event_code,
                                _staff_code: appConfig.staff_code ? appConfig.staff_code : 'staff3'
                            });

                            // save the leads in the table
                            db.insert({
                                event_code: opts.params._event_code,
                                synced: false,
                                captime: captime,
                                params_obj: opts.params,
                                params: jQuery.param(opts.params)
                            }, function(err, doc) {
                                if (err) {
                                    deferred.reject(err);
                                    return;
                                }

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