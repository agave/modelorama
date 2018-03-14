const { join } = require('path');

module.exports = Grown => {
  const db = Grown.Model.DB.default;
  const cwd = db.repository.connection.directory;

  if (Grown.GraphQL) {
    Grown.def('Resolvers', join(cwd, 'resolvers'));
  }

  if (Grown.GRPC) {
    Grown.def('Handlers', join(cwd, 'handlers'));
    Grown('GRPC.Gateway', {
      include: [
        Grown.GRPC.Loader.scan(join(cwd, 'generated/index.proto')),
      ],
    });
    Grown('Services', {
      include: [
        Grown.GRPC.Gateway.setup(Grown.Handlers, { timeout: 10 }),
      ],
    });
  }
};

module.exports.setup = fn => opts => Grown => {
  fn(Grown, opts);

  return Grown('Models', {
    include: [
      Grown.Model.DB.bundle({
        types: join(opts.config.directory, 'generated'),
        models: join(opts.config.directory, 'models'),
        database: {
          refs: opts.refs,
          hooks: opts.hooks,
          config: opts.config,
        },
      }),
    ],
  });
};

module.exports.plug = (Grown, server) => {
  const db = Grown.Model.DB.default;
  const cwd = db.repository.connection.directory;

  if (Grown.GraphQL) {
    server.mount('/api/graphql', Grown.GraphQL.setup([
      join(cwd, 'common.gql'),
      join(cwd, 'generated/index.gql'),
    ], Grown.Resolvers));
  }

  server.on('listen', () => {
    Grown.Models.connect();
    if (Grown.GRPC) {
      Grown.Services.start();
    }
  });
};

module.exports.db = (Grown, options) => {
  const opts = {
    uploadDir: 'tmp/uploads',
    database: 'default',
    ...options,
  };

  return Grown.Model.Formator({
    prefix: '/db',
    options: {
      attributes: false,
      uploadDir: opts.uploadDir,
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
      return Grown.Model.DB[opts.database];
    },
  });
};
