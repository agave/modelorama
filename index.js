module.exports.setup = fn => opts => Grown => {
  fn(Grown, opts);

  return Grown('Models', {
    include: [
      Grown.Model.DB.bundle({
        types: `${opts.config.directory}/generated`,
        models: `${opts.config.directory}/models`,
        database: {
          refs: opts.refs,
          hooks: opts.hooks,
          config: opts.config,
        },
      }),
    ],
  });
};

module.exports.plug = (Grown, server, options) => {
  const db = Grown.Model.DB[options.database || 'default'];
  const cwd = db.repository.connection.directory;

  function define(name, subDir, comments) {
    const repo = Grown[name] = Grown.load(subDir);

    Object.defineProperty(repo, 'typedefs', {
      get() {
        const fix = key(name);
        const types = repo.typesOf({ declaration: `${fix}:${fix}` });
        const models = types.filter(x => x.type);

        return types.map(x => x.chunk)
          .concat(`/**\nFound modules from \`${subDir}\`\n*/`)
          .concat(`export default interface ${name} {${
            models.map(x => [
              comments && `\n/**\nThe \`${x.type}\` ${fix.toLowerCase()}.\n*/`,
              `\n  ${x.type}: ${x.type}${fix};`,
            ].filter(Boolean).join('')).join('')
          }\n}`)
          .join('\n');
      },
    });
  }

  if (options.graphql) {
    define('Resolvers', `${cwd}/resolvers`);
    server.mount('/api/graphl', Grown.GraphQL.setup([
      `${cwd}/common.gql`,
      `${cwd}/generated/index.gql`,
    ], Grown.Resolvers));
  }

  if (options.grpc) {
    define('Handlers', `${cwd}/handlers`);
    Grown('GRPC.Gateway', {
      include: [
        Grown.GRPC.Loader.scan(`${cwd}/generated/index.proto`),
      ],
    });
    Grown('Services', {
      include: [
        GRPC.Gateway.setup(Grown.Handlers, { timeout: 10 }),
      ],
    });
  }

  server.on('listen', async () => {
    await Grown.Models.connect();
    if (options.grpc) {
      await Grown.Services.start();
    }
  });
};

module.exports.db = Grown =>
  Grown.Model.Formator({
    prefix: '/db',
    options: {
      attributes: false,
      uploadDir: Grown.argv.flags.upload,
      onUpload: ({ field, payload, metadata }) => {
        payload[field] = metadata.path.replace(/^[^/]+\//, '');
      },
      connections: () => Object.keys(Grown.Model.DB._registry),
    },
    database: req => {
      const matches = req.url.match(/^\/([a-z]\w+)(|\/.*?)$/);

      if (matches && Grown.Model.DB._registry[matches[1]]) {
        req.originalUrl = req.url;
        req.url = matches[2] || '/';

        return Grown.Model.DB[matches[1]];
      }
      return Grown.Model.DB.default;
    },
  });
