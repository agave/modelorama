module.exports = async Grown => ({
  Models: await require('..').setup(Grown, {
    config: {
      dialect: 'sqlite',
      storage: '/tmp/db.sqlite',
      directory: `${__dirname}/schema`,
    },
  }),
});
