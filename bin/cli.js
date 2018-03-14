const Grown = require('@grown/bud')();
const util = require('@grown/bud/util');

process.silent = true;
process.name = `🍻 Modelorama v${Grown.pkg.version}`;

const argv = util.argvParser(process.argv.slice(2), {
  boolean: 'hDfdV',
  string: 'ey',
  alias: {
    e: 'env',
    h: 'help',
    D: 'docs',
    y: 'only',
    f: 'force',
    d: 'debug',
    V: 'verbose',
  },
});

Grown.use(require('@grown/cli'));
Grown('CLI', {
  banner_text: false,
  command_line: argv,
  command_name: 'modelo',
  task_folders: [`${__dirname}/tasks`],
});

Grown.CLI.start(argv._[0])
  .catch(e => {
    console.error(`\r\x1b[31m${e.stack}\x1b[0m\n`);
    process.exit(1);
  });
