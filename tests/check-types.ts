import Modelorama from '..';
import Grown from './server';
import type { DB, Example } from './server';

Grown.use(require('@grown/model'));

async function main() {
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
