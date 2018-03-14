Modelorama showcases Protobuf, GraphQL and JSON-Schema cooperating to achieve a solid service-based architecture for web applications.

- The front-end API is built on GraphQL, communication between back-end services is done with gRPC.
- The database is built on top of Sequelize, also powered by JSON-Schema.

This architecture layout aims to reduce unit-testing at minimum.

# Table of contents

- [How it works?](#how-it-works)
- [Quick start](#quick-start)
  - [Models](#models)
  - [Database](#database)

## How it works?

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

- JSON-Schema is used to validate shape, format, content and advanced relationships of the data itself.
- GraphQL and Protobuf can be used to validate shape and types on any message being transmitted.
- TypeScript can check the resulting types, just regenerate them if you update the schema.

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

## Quick start

Clone this repo quickly with `degit`:

```bash
npm init modelorama ./my-app
cd my-app
make dev
```

> To display all available tasks just run `make` without arguments.

### Models

Adding new types to the system:

- Model/JSON-Schema definition at `app/schema/models`
- GraphQL resolver at `app/schema/graphql` (optional)
- gRPC handler at `app/schema/handlers` (optional)

Try:

- `modelo add model Example name:string!` to generate the model definition
- `modelo add def Example Query.{example,examples}` to generate the GraphQL resolvers
- `modelo add def Example {example,examples}` to generate the gRPC handlers

> To get rid of generated files you can execute `modelo undo` to remove them.

Use `modelo add service Test` to generate all the required files based on a service definition.

Try:

- `modelo add service Test get:example:Example get:examples:ExampleList` to prepend calls on the service definition.

> The requested service will be generated if the service does not exists already.

### Database

In order to migrate the database you MUST:

1. Run `modelo db migrate` to create the migration files
2. Run `modelo db migrate --up` to execute those migrations
3. Run `modelo db migrate --apply "initial version"` to take a snapshot

Run `git commit` to keep your changes, or `make prune` to discard them.

> Every modification on the schemas MUST be reflected by repeating the steps described above to ensure atomic changes over time.

The `db/schema.js` file is a single-shot migration or snapshot from the current database shape.

> Snapshots are faster than running all migrations from ground up, try `make database` to recreate it back.
