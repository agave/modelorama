const Grown = require('grown')();

Grown.use(require('@grown/model/db'));

Grown.use(require('..').setup({
  config: {
    dialect: 'sqlite',
    storage: '/tmp/db.sqlite',
    directory: `${__dirname}/schema`,
  },
}));

module.exports = Grown.ready();
