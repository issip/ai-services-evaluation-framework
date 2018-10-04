require-component
=================

Require component and npm modules

Installation
------------

```sh
$ component install camshaft/require-component
```

## API

```js
// Wrap require
require = require('require-component')(require);

// Works in component and npm environments
var each = require('each');
```

You can also specify the npm fallback:

```js
var each = require('each', 'my-npm-each-implementation');
```

## License

MIT
