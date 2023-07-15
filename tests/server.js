module.exports = async () => {
  const Grown = await require('./main');
  const server = new Grown();

  server.on('listen', app => {
    console.log(app.location.href);
  });

  return server;
};
