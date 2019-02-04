import test from 'tape';
import reporter from 'electron-tap/reporter';
import bootstrap from './bootstrap.js';

test('setup', bootstrap.setup);