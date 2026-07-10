/**
 * Test setup — hooks into Module._resolveFilename to redirect
 * react-native to a mock, avoiding esbuild transform errors on
 * Flow-typed `import typeof` syntax in react-native/index.js.
 */
const Module = require('module');
const path = require('path');

const mockPath = path.resolve(__dirname, 'react-native.mock.cjs');

const origResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (
    request === 'react-native' ||
    request.startsWith('react-native/')
  ) {
    return origResolveFilename.call(
      this,
      mockPath,
      parent,
      isMain,
      options,
    );
  }
  return origResolveFilename.call(this, request, parent, isMain, options);
};
