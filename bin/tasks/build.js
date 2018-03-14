'use strict';

/* istanbul ignore file */

const USAGE_INFO = `

  Builds the required files for models

  If no hook is given it'll run sastre to compile TypeScript sources.

  Hooks:
    __HOOKS__

  Examples:
    {bin} build docs
    {bin} build types path/to/database
    {bin} build schema path/to/database --docs
    {bin} build path/to/database -ti server.js Routes:routes

`;

const DOCS_USAGE = `

  Generate typedoc from given sources

  PATH  Directory to search for files

  All TypeScript sources are scanned to build the documentation,
  generated types can be annotated too, e.g. \`{bin} build schema db --docs\`

`;

const TYPES_USAGE = `

  Generate .d.ts declarations from given sources

  PATH  Entry file exporting models

  Types are extracted from previously generated schemas,
  when enabled, types from all registered services are also generated.

`;

const SCHEMA_USAGE = `

  Generate .json, .proto and .gql from given models

  PATH  Entry file exporting models

  Required modules and types for the models, GraphQL, Protobuf and TypeScript
  are built this way; execute it after adding or modifying model or service definitions.

`;

const { join, relative, dirname } = require('path');
const { existsSync } = require('fs');
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

      const cwd = Grown.argv._[2];
      const app = process.main || Grown.argv.flags.app || 'app.js';
      const appDir = app.replace('..', dirname(cwd));
      const appTs = `${app.replace('.js', '')}.d.ts`;
      const dts = join(cwd, appTs);

      const rootDir = cwd.includes('/') ? dirname(cwd) : cwd;
      const baseDir = cwd.substr(dirname(appDir).length + 1);
      const modelsDir = Grown.argv.flags.models || join(cwd, 'models');
      const routesDir = Grown.argv.flags.routes || join(cwd, 'routes');
      const handlersDir = Grown.argv.flags.handlers || join(cwd, 'handlers');
      const resolversDir = Grown.argv.flags.resolvers || join(cwd, 'resolvers');

      const here = filepath => (filepath.charAt() === '.' ? filepath : `.${baseDir ? `/${baseDir}` : ''}/${filepath}`);

      if (!existsSync(dts)) {
        const routes = Grown.argv.flags.routes !== false && existsSync(routesDir);
        const handlers = Grown.argv.flags.handlers !== false && existsSync(handlersDir);
        const resolvers = Grown.argv.flags.resolvers !== false && existsSync(resolversDir);
        const modelsPath = here(relative(cwd, modelsDir));

        Grown.CLI._.write(dts, [
          'import { ModeloramaServices, GrownInterface',
          handlers ? ', GRPCService' : '',
          ", Repository } from 'modelorama';\n",
          `import type Models from '${modelsPath}';\n`,
          routes ? `import type Routes from '${here(relative(rootDir, routesDir))}';\n` : '',
          handlers ? `import type Handlers from '${here(relative(rootDir, handlersDir))}';\n` : '',
          resolvers ? `import type Resolvers from '${here(relative(rootDir, resolversDir))}';\n` : '',
          '\n',
          `export { default as DB } from '${modelsPath}';\n`,
          `export * from '${modelsPath}';\n`,
          '\n',
          'export interface Services extends ModeloramaServices',
          handlers ? ', GRPCService<Handlers>' : '',
          ' {\n',
          handlers ? '  API: Handlers;\n' : '',
          '}\n',
          '\n',
          'export interface Application extends GrownInterface {\n',
          '  Models: Repository<Models>;\n',
          '  Services: Services;\n',
          routes ? '  Routes: Routes;\n' : '',
          handlers ? '  Handlers: Handlers;\n' : '',
          resolvers ? '  Resolvers: Resolvers;\n' : '',
          '}\n',
          '\n',
          'declare const _default: Application;\n',
          'export default _default;\n',
        ].join(''));
      }

      function types(kind) {
        const key = kind.toLowerCase();
        const subDir = Grown.argv.flags[key] || join(cwd, key);
        const fixed = `${kind}:${relative(cwd, subDir)}`;

        if (existsSync(subDir)) return fixed;
      }

      return Grown.CLI._exec([require.resolve('sastre/bin/cli'),
        Grown.argv._[2],
        '-bti', app,
        ...['Models', 'Routes', 'Handlers', 'Resolvers'].map(types),
      ].filter(Boolean), () => process.exit());
    });

    Grown.CLI.define('build:schema', SCHEMA_USAGE, () => {
      if (!Grown.argv.params.models) {
        throw new Error(`Missing models:PATH to load, given '${Grown.argv.params.models || ''}'`);
      }

      const cwd = Grown.argv.params.models;
      const handlersDir = join(cwd, Grown.argv.flags.handlers || 'handlers');
      const resolversDir = join(cwd, Grown.argv.flags.resolvers || 'resolvers');

      const handlers = Grown.argv.flags.handlers !== false && existsSync(handlersDir);
      const resolvers = Grown.argv.flags.resolvers !== false && existsSync(resolversDir);

      const commonGQL = join(cwd, 'common.gql');
      const commonProto = join(cwd, 'common.proto');

      if (handlers && !existsSync(commonProto)) {
        Grown.CLI._.write(commonProto, [
          'syntax = "proto3";\n',
          'package schema;\n',
          'message Noop {}\n',
        ].join(''));
      }

      if (resolvers && !existsSync(commonGQL)) {
        Grown.CLI._.write(commonGQL, [
          'type Query {\n',
          '  dummy: [String]\n',
          '}\n',
          'type Mutation {\n',
          '  dummy: [String]\n',
          '}\n',
          'schema {\n',
          '  query: Query\n',
          '  mutation: Mutation\n',
          '}\n',
        ].join(''));
      }

      return Grown.CLI._exec([require.resolve('json-schema-to/bin/cli'),
        '-btw', cwd,
        '-i', 'uiSchema',
        '-qpc', 'index',
        '-k', 'API',
        '--typescript',
        '--json',
        Grown.argv.flags.docs ? '-D' : null,
        handlers ? '--protobuf' : null,
        resolvers ? '--graphql' : null,
        ...(handlers ? ['-r', '../common'] : []),
      ].filter(Boolean), () => process.exit());
    });
  },
  callback(Grown) {
    const tasks = Grown.CLI.subtasks('build');

    if (!Grown.argv.params.models && Grown.argv._[2]) {
      Grown.argv.params.models = Grown.argv._[2];
    }

    if (tasks[Grown.argv._[1]]) {
      return tasks[Grown.argv._[1]].callback();
    }

    return Grown.CLI._exec([require.resolve('sastre/bin/cli'), ...process.argv.slice(3)], () => process.exit());
  },
};
