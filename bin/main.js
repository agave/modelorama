const SERVICE_GENERATOR = `

  Writes a service definition from given types

  Accepted parameters are:

  - get       <string>          # Service call or Query
  - set       <string>          # Service call or Mutation
  - resp      <string>          # Response type of this call (optional)
  - params    <string>          # Custom input type for this call (gRPC only)
  - input     <string|{k:T}[]>  # Either a single type or a input:Type map (optional)
  - query     <boolean|null>    # If null, omit input entirely; if false skip children (optional)
  - required  <boolean|T[]>     # Sets the input as mandatory, it can be a list of types (optional)

  When using gRPC the params can refer to a custom type, otherwise it'll use the default input type.

`;

module.exports = Grown => {
  Grown.CLI.define('generate:service', SERVICE_GENERATOR, ({ use, args, files }) => {
    const def = Grown.CLI._.parse(use);
    const defs = def.target.definitions;

    delete def.target.definitions;

    def.target.id = def.target.id || def.key;
    def.target.service = def.target.service || {};
    def.target.service.calls = def.target.service.calls || [];

    let offset = def.target.service.calls.length;
    for (let i = 0; i < offset; i += 1) {
      const a = Grown.argv.params.get || Grown.argv.params.set;
      const b = def.target.service.calls[i].get || def.target.service.calls[i].set;

      if (a === b) {
        offset = i;
        break;
      }
    }

    if (offset !== def.target.service.calls.length && !Grown.argv.flags.force) {
      throw new TypeError(`Service call for '${JSON.stringify(Grown.argv.params)}' already exists`);
    }

    const value = Object.keys(Grown.argv.params).reduce((memo, cur) => {
      if (/^(?:true|false|null|\[.*?\]|{.*?})$/.test(Grown.argv.params[cur])) {
        memo[cur] = JSON.parse(Grown.argv.params[cur]);
      } else {
        memo[cur] = Grown.argv.params[cur] || undefined;
      }
      return memo;
    }, {});

    args.forEach(key => {
      value[key] = true;
    });

    def.target.service.calls[offset] = { ...def.target.service.calls[offset], ...value };
    def.target.definitions = { [def.key]: '__schema__', ...defs };

    const output = def.serialize()
      .replace(/: __schema__/g, ': !include schema.json');

    files.push([`${use}#/service/calls/${offset}`, output, true]);
  });
};
