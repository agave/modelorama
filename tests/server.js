module.exports = {
  Models: require('..').setup(Grown => {
    Grown.use(require('@grown/model'));
  })({
    config: {
      dialect: 'sqlite',
      storage: '/tmp/db.sqlite',
      directory: `${__dirname}/schema`,
    },
  })(require('@grown/bud')()),
};
