#!/usr/bin/env node

const Grown = require('@grown/bud')();
const util = require('@grown/bud/util');
const pkg = require('../package.json');

process.name = `🍻 Modelorama v${pkg.version}`;

const argv = util.argvParser(process.argv.slice(2), {
  boolean: 'DfdV',
  string: 'heya',
  alias: {
    e: 'env',
    a: 'app',
    h: 'host',
    y: 'only',
    f: 'force',
    d: 'debug',
    V: 'verbose',
  },
});

Grown.use(require('@grown/cli'));
Grown.use(require('./main'));

Grown('CLI', {
  banner_text: false,
  command_line: argv,
  command_name: 'pot+mdl',
  task_folders: [`${__dirname}/tasks`],
});

Grown.CLI.start(argv._[0])
  .catch(e => {
    console.error(`\r\x1b[31m${e.stack}\x1b[0m\n`);
    process.exit(1);
  });
