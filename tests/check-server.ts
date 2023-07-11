import ServerInstance from './server';
import type { ExampleModel } from './server';

async function main() {
  const { get, connect } = await ServerInstance.Models;

  await connect();

  const Ex = get<ExampleModel>('Example');

  await Ex.sync({ force: true });
  const c = await Ex.count();

  console.log(c);
}
main();
