import Modelorama from '..';
import ServerInstance from './main';
import type { DB, Example } from './main';

async function main() {
  const Grown = await ServerInstance;

  Grown.use(require('@grown/model'));

  const Models = await Modelorama.setup<DB>(Grown, {
    config: {
      dialect: 'sqlite',
      storage: '/tmp/db.sqlite',
      directory: `${__dirname}/schema`,
    },
  });

  const ex = Models.get('Example').getSchema<Example>();

  console.log(ex.fakeOne({ alwaysFakeOptionals: true }));
}
main();
