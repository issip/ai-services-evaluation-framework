envs
====

Track environment variable usage

Usage
-----

```js
var envs = require('envs');

// enable tracing
env.trace = true;

console.log(envs('NODE_ENV'));
// "production"

console.log(envs('NONEXISTANT', 'my default value'));
// "my default value"

console.log(env.usages);
// { NODE_ENV: 
//   [ { lineno: '/Users/cameron/Projects/misc/envs/example.js:3:13',
//       defaultVal: undefined,
//       val: 'production' } ],
//  NONEXISTANT: 
//   [ { lineno: '/Users/cameron/Projects/misc/envs/example.js:6:13',
//       defaultVal: 'my default value',
//       val: 'my default value' } ] }
```

Testing
-------

```sh
$ npm test
```
