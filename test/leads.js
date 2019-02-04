import test from 'tape';
import reporter from 'electron-tap/reporter';
import bootstrap from './bootstrap.js';

test('Lead Service', (t) => {

    test('Email domains there?', (t) => {
        t.equal(bootstrap.LeadService.emailDomains.length, 21, 'There are 21 email domains');
        t.notEqual(bootstrap.LeadService.emailDomains.indexOf('@gmail.com') , '-1', '@gmail.com is in there');
        t.end();
    });

    test('Can retrieve provider config?', (t) => {
        t.equal(bootstrap.LeadService.getConfig('device_code'), 'acura_master', 'Device code set to "acura_master"');
        t.equal(bootstrap.LeadService.getConfig('vehicle_make'), 'acura', 'Vehicle Make is set to "acura"');
        t.end();
    });

    test('Can set provider config?', (t) => {
        bootstrap.LeadService.setConfig({
            'device_code': 'honda_master',
            'vehicle_make': 'honda'
        });

        t.equal(bootstrap.LeadService.getConfig('device_code'), 'honda_master', 'Device code changed to "honda_master"');
        t.equal(bootstrap.LeadService.getConfig('vehicle_make'), 'honda', 'Vehicle Make changed to "honda"');
        t.end();
    });

    test('Can setup leadgen?', (t) => {
        let leadgenConfig = new bootstrap.ConfigService({type: 'leadgen'});

        leadgenConfig.save({
            application: {
                application_code: 'UNITAPP'
            },
            collection_method: 'wheelstand',
            device: {
                device_code: 'unit_master'
            },
            account: {
                account_code: 'unit'
            },
            event: {
                code: 'unit_test_event'
            },
            meta: {
                meta_data: {}
            },
            staff_code: {}
        }).finally(() => {

            leadgenConfig.get()
                .then((response) => {
                    t.equal(response.application.application_code, 'UNITAPP', 'Application code was set to "UNITAPP"');
                    t.equal(response.device.device_code, 'unit_master', 'Device code was set to "unit_master"');
                    t.equal(response.collection_method, 'wheelstand', 'Collection method was set to "wheelstand"');
                    t.end();
                });
        });
    });

    test('Fetches all accounts?', {timeout: 1500}, (t) => {
        let accounts = [],
            success = false;

        bootstrap.LeadService.getAccounts()
            .then((response) => {
                accounts = response.data || [];
                success  = response.success || false;
            })
            .finally(() => {
                t.ok(accounts.length, 'There is more than one account');
                t.ok(accounts[0].account_name, 'The account_name is set on the first item');
                t.ok(accounts[accounts.length - 1].account_name, 'The account_name is set on the last item');
                t.ok(success, 'The response came back with success == true');
                t.end();
            });
    });

    test('Calendar can get leads', (t) => {
        let leads = 0;

        bootstrap.LeadService.save({
            params: {
                name_first: 'Test',
                name_last: 'Testing'
            }
        }).then(() => {
            let today = new Date();

            bootstrap.LeadService.getLeadsByMonth({month: today.getMonth() + 1, year: today.getFullYear()})
                .then((response) => {
                    leads = Object.keys(response).length;
                })
                .finally(() => {
                    t.ok((leads > 0), `There is at least one day of leads in the current month. (Days with leads: ${leads})`);
                    t.end();
                });
            });
    });

    t.end();
});