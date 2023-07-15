import ServerInstance from './main';
import type { ExampleModel } from './main';

async function main() {
  const Grown = await ServerInstance;
  const { get, connect } = Grown.Models;

  await connect();

  const Ex = get<ExampleModel>('Example');

  await Ex.sync({ force: true });
  const c = await Ex.count();

  console.log(c);
}
main();
