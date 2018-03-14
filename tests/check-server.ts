import ServerInstance from './server';
import type { ExampleModel } from './server';

async function main() {
  await ServerInstance.Models.connect();

  const Ex = ServerInstance.Models.get<ExampleModel>('Example');

  await Ex.sync({ force: true });
  const c = await Ex.count();

  console.log(c);
}
main();
