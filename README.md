[![ci](https://github.com/grownjs/modelorama/actions/workflows/ci.yml/badge.svg)](https://github.com/grownjs/modelorama/actions/workflows/ci.yml)

**Modelorama** showcases Protobuf, GraphQL and JSON-Schema cooperating to achieve a solid service-based architecture for web applications.

- The database is built on top of Sequelize, also powered by JSON-Schema
- The front-end API talks GraphQL while communication between back-end services is done through gRPC (optional)
- The implemented APIs can be written or consumed in TypeScript, by following the suggested architecture typings are granted (optional)

<details><summary><big>Setup</big></summary>

<br />

Install `grown` and `modelorama` globally or in your project:

```bash
npm i grown modelorama --save # or `npm i -g grown modelorama`
```

To begin with, just write the main `db/app.js` file:

```js
const Grown = require('grown')();

Grown.use(require('.'));
Grown.use(require('modelorama'));

module.exports = Grown;
```

> Here we're also registering `modelorama` to enable the discovery of `db/resolvers` and `db/handlers` if GraphQL and gRPC are enabled respectively.

Now write a `db/index.js` file with the following code:

```js
module.exports = Grown => require('./generated')(require('modelorama')
  .setup(Grown, {
    refs: require('./generated').default,
    config: {
      dialect: 'sqlite',
      storage: '/tmp/db.sqlite',
      directory: __dirname,
    },
  }));
```

> This script will be used as module, it loads and configures the database repository.

Finally, you'll need to write a `server.js` file:

```js
const Grown = require('./db/app');

const server = new Grown();

server.on('listen', app => {
  console.log(app.location.href);
});

module.exports = server;
```

> The later script will let you start the application server with `pot server start`
> &mdash; try running `mdl` without arguments to list all available tasks and options.

If you want to start the server manually (e.g. `PORT=1234 node server`), then modify the script as follows:

```diff
-module.exports = server;
+if (require.main !== module) {
+  module.exports = server;
+} else {
+  server.listen(process.env.PORT || 8080);
+}
```

</details>

<details><summary><big>Quick start</big></summary>

<br />

By default, we're gonna place all the related sources together, i.e. the `db` directory:

- Model and their JSON-Schema definitions at `db/models`
- GraphQL resolvers at `db/resolvers` (optional)
- gRPC handlers at `db/handlers` (optional)

#### Types and Schemas

1. Lets add a type: `pot generate type db/types/dataTypes.yml pk primaryKey autoIncrement type:integer`

2. Now create a model: `pot generate model db/models/User id:dataTypes/pk email:string password:string`

3. Run `pot build schema db` to generate the required sources.

> Try the interactive console with `pot console db` to debug your models
> &mdash; run `User.sync({ force: true })` to recreate the model if does not exists already!

#### Database migrations

In order to properly migrate the database from the previous steps you MUST:

1. Run `pot migrate db --make` to create the migration files.
2. Run `pot migrate db --up` to execute those migrations.
3. Run `pot migrate db --apply "initial version"` to take a snapshot.

> Every modification on the schemas should be followed by repeating the steps described above to ensure atomic changes over time &mdash; use `git commit` to keep your changes.

The `db/schema.js` file is a single-shot migration or snapshot from the current database shape.

> Snapshots are faster than running all migrations from ground up
> &mdash; try `pot migrate db --create` to recreate the database from scratch.

#### TypeScript usage

Run `pot build types db` to generate the types from the current modules.

Now, you can import the types used in your code:

```typescript
import Grown from './db/app';
import type { UserModel } from './db/app';

async function main() {
  await Grown.Models.connect();

  const User = Grown.Models.get<UserModel>('User');

  await User.sync({ force: true });
  const c = await User.count();

  console.log(c);
}
main();
```

Also you can type the whole connection at once:

```typescript
import Grown from './db/app';
import Modelorama from 'modelorama';
import type { DB, User } from './db/app';

Grown.use(require('@grown/model'));

const Models = await Modelorama.setup<DB>(Grown, {
  config: {
    dialect: 'sqlite',
    storage: '/tmp/db.sqlite',
    directory: `${__dirname}/db`,
  },
});

const UserModel = Models.get('User').getSchema<User>();

console.log(UserModel.fakeOne({ alwaysFakeOptionals: true }));
```

</details>

<details><summary><big>How it works?</big></summary>

<br />

We have types and schemas to build our model definitions,
later we can declare (optionally) services for GraphQL and gRPC.

&mdash; **Types** are declared in JSON-Schema:

```json
{
  "id": "Example",
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    }
  },
  "required": ["name"]
}
```

This can be traduced to GraphQL:

```graphql
type Example {
  name: String!
}
```

Protobuf can be generated the same way:

```protobuf
message Example {
  required string name = 1;
}
```

As well its corresponding TypeScript type:

```ts
export type Example = {
  name: string;
}
```

All this means:

- JSON-Schema is used to validate shape, format, content and advanced relationships as data.
- GraphQL and Protobuf can be used to validate shape and types on any message being transmitted.
- TypeScript can check your code with the proper types, just regenerate them if you update the schema.

&mdash; **Services** can be expressed using JSON or YAML:

```yaml
id: Test

service:
  calls:
  - get: example
    resp: Example
  - get: examples
    resp: ExampleList

definitions:
  Example: !include schema.json
  ExampleList:
    type: array
    items:
      $ref: Example
```

> `Test` is not a schema because it lacks of `properties`, it cannot be used as `$ref`.

As you've pictured it, we'll get a working GraphQL declaration with its corresponding Protobuf service definition and TypeScript types, etc.

Service `calls` are used to declare how gRPC and GraphQL will communicate, when omitted, you can also get rid of their handlers and resolvers, respectively.

> GraphQL and gRPC integrations are completely optional.

#### Services usage

Definitions made for GraphQL and gRPC are available as middleware.

To make them work, you need to register them in your `server.js` script:

```diff
server.on('listen', app => {
  console.log(app.location.href);
});
+
+require('modelorama').plug(Grown, server);
+
+server.plug(require('modelorama').db(Grown));
```

Respectively:

- `plug(Container, serverInstance)` &mdash; will load and register the required modules for the enabled features, models are always booted upon connection.
- `db(Container)` &mdash; returns a middleware that responds to `/db` for scaffolding purposes; it helps to quickly create, read, update and delete data from your registered models.

#### Handlers and Resolvers

1. Lets generate a service for listing users: `pot generate service db/models/User/resource.yml get:users resp:UserList`

2. Now, lets add the required types: `pot generate type db/models/User/resource.yml UserList type:array items:User`

3. Generate the GraphQL resolver: `pot generate def db/resolvers/User Query.users --use API --args ctx`

4. Generate the gRPC handler: `pot generate def db/handlers/User users --use User --args ctx`

5. Provider for GraphQL resolvers: `pot generate def db/resolvers/provider.js API`

6. Provider for gRPC handlers: `pot generate def db/handlers/provider.js User`

> Run `pot build schema db` to regenerate all model sources.

You'll need to update your `db/index.js` script as well:

```diff
    Grown.use(require('@grown/model'));
+    Grown.use(require('@grown/grpc'));
+    Grown.use(require('@grown/graphql'));
```

> These modules are required to enable the services on the container.

At this point, you should be able to run `pot server` without crashing... cheers!

But now, depending on the enabled services you should update the `db/app.d.ts` types:

```diff
import type Models from './models';
+import type Handlers from './handlers';
+import type Resolvers from './resolvers';
...
export interface Server extends GrownInterface {
  Models: Repository<Models>;
  Services: Services;
+  Handlers: Handlers;
+  Resolvers: Resolvers;
}
```

> Run `pot build types db` again to regenerate all types.

That's it! &mdash; now you should be able to import those modules with TypeScript, e.g.

```typescript
import Grown from './db/app';

console.log(Grown.Models.get('User'));
console.log(Grown.Handlers.User.users.toString());
console.log(Grown.Resolvers.User.Query.users.toString());
```

</details>
