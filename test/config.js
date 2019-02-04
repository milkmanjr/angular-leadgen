import test from 'tape';
import reporter from 'electron-tap/reporter';
import bootstrap from './bootstrap.js';

test('Config Service', (t) => {
    let appConfig = new bootstrap.ConfigService({type: 'app'});

    test('Can read AppConfig JSON files?', (t) => {
        let json = false;

        appConfig.get()
            .then((response) => {
                json = response;
            })
            .finally(()=> {
                t.equal(typeof json, 'object', 'Got some JSON back.');
                t.end();
            });
    });

    test('Can save AppConfig JSON files?', (t) => {
        let json         = false,
            randomNumber = Math.ceil(2020 * Math.random());

        appConfig.save({part_of_test: randomNumber})
            .then((response) => {

            })
            .finally(() => {
                appConfig.get()
                    .then((response) => {
                        json = response
                    })
                    .finally(() => {
                        t.equal(typeof json, 'object', 'Got back some JSON');
                        t.equal(json.part_of_test, randomNumber, 'The value we set it to is the value we got back. (' + randomNumber +')');
                        t.ok(json.updated_time, '\'Updated time\' is populated with a value (' + json.updated_time + ')');
                        t.end();
                    });
            });

    });

    t.end();
});