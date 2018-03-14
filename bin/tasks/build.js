'use strict';

/* istanbul ignore file */

const USAGE_INFO = `

  Builds the required files for models

  Hooks:
    __HOOKS__

`;

const DOCS_USAGE = `

  Docs...

`;

const TYPES_USAGE = `

  Types...

`;

const SCHEMA_USAGE = `

  Schema...

`;

const { join, relative } = require('path');
const { sync } = require('glob');

module.exports = {
  description: USAGE_INFO,
  configure(Grown) {
    Grown.CLI.define('build:docs', DOCS_USAGE, () => {
      if (!Grown.argv._[2]) throw new Error('Missing application path');

      const cwd = join(Grown.cwd, Grown.argv._[2]);
      const files = sync('**/*.ts', { cwd })
        .map(file => join(cwd, file))
        .filter(file => !(
          file.includes('test.ts')
          || file.includes('index.ts')
          || file.includes('/generated/')
          || file.includes('provider.d.ts')
        ));

      const options = {
        disableSources: true,
        excludeExternals: true,
        excludeInternal: true,
        excludePrivate: true,
        excludeProtected: true,
      };

      const typedocModule = require('typedoc');
      const app = new typedocModule.Application();

      app.options.addReader(new typedocModule.TSConfigReader());
      app.options.addReader(new typedocModule.TypeDocReader());

      app.bootstrap({ ...options, entryPoints: files });

      const project = app.convert();

      if (project) {
        app.generateDocs(project, join(Grown.cwd, 'docs'));

        if (app.logger.hasErrors()) {
          console.error(app.toString());
        }
      }
    });

    Grown.CLI.define('build:types', TYPES_USAGE, () => {
      if (!Grown.argv._[2]) throw new Error('Missing application path');

      return Grown.CLI._exec([require.resolve('sastre/bin/cli'),
        Grown.argv._[2],
        '-tiserver',
        `Models:${relative(Grown.argv._[2], `${Grown.argv.params.models}/models`)}`,
        ...(Grown.argv.flags.grpc ? [`Handlers:${relative(Grown.argv._[2], `${Grown.argv.params.models}/handlers`)}`] : []),
        ...(Grown.argv.flags.graphql ? [`Resolvers:${relative(Grown.argv._[2], `${Grown.argv.params.models}/resolvers`)}`] : []),
      ], () => process.exit());
    })

    Grown.CLI.define('build:schema', SCHEMA_USAGE, () => {
      if (!Grown.argv.params.models) {
        throw new Error(`Missing models:PATH to load, given '${Grown.argv.params.models || ''}'`);
      }

      return Grown.CLI._exec([require.resolve('json-schema-to/bin/cli'),
        '-btw', Grown.argv.params.models,
        '-i', 'uiSchema',
        '-qpc', 'index',
        '-k', 'API',
        '--typescript',
        '--json',
        Grown.argv.flags.docs ? '-D' : null,
        Grown.argv.flags.grpc ? '--protobuf' : null,
        Grown.argv.flags.graphql ? '--graphql' : null,
        ...(Grown.argv.flags.grpc ? ['-r', '../common'] : []),
      ].filter(Boolean), () => process.exit());
    });
  },
  callback(Grown) {
    const tasks = Grown.CLI.subtasks('build');

    if (tasks[Grown.argv._[1]]) {
      return tasks[Grown.argv._[1]].callback();
    }

    return Grown.CLI._exec([require.resolve('sastre/bin/cli'), ...process.argv.slice(3)], () => process.exit());
  },
};
