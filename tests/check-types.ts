import Modelorama from '..';
import type { DB, Example } from './server';

const Models = Modelorama.setup<DB>(Grown => {
  Grown.use(require('@grown/model'));
})({
  config: {
    dialect: 'sqlite',
    storage: '/tmp/db.sqlite',
    directory: `${__dirname}/schema`,
  },
})(require('@grown/bud')());

const ex = Models.get('Example').getSchema<Example>();

console.log(ex.fakeOne({ alwaysFakeOptionals: true }));
