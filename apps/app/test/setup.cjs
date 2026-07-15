/**
 * Test setup — hooks into Module._resolveFilename to redirect
 * react-native and @react-navigation/* to mocks, avoiding:
 *  - esbuild transform errors on Flow-typed `import typeof` syntax in react-native/index.js
 *  - Missing navigation context errors from @react-navigation/core
 *  - Missing AppProvider context errors from AppContext.tsx
 */
const Module = require('module');
const path = require('path');

const reactNativeMock = path.resolve(__dirname, 'react-native.mock.cjs');
const reactNavigationMock = path.resolve(__dirname, 'react-navigation.mock.cjs');
const appContextMock = path.resolve(__dirname, 'app-context.mock.cjs');

// The resolved path of the real AppContext module (with tsx extension stripping)
const appContextPath = path.resolve(__dirname, '..', 'context', 'AppContext.tsx');

const origResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  // Redirect react-native and its sub-paths to mock
  if (
    request === 'react-native' ||
    request.startsWith('react-native/')
  ) {
    return origResolveFilename.call(
      this,
      reactNativeMock,
      parent,
      isMain,
      options,
    );
  }

  // Redirect @react-navigation/native to mock (avoids real core useNavigation)
  if (request === '@react-navigation/native') {
    return origResolveFilename.call(
      this,
      reactNavigationMock,
      parent,
      isMain,
      options,
    );
  }

  // Redirect @react-navigation/native-stack to a minimal mock (type-safe)
  if (request === '@react-navigation/native-stack') {
    return origResolveFilename.call(
      this,
      reactNavigationMock,
      parent,
      isMain,
      options,
    );
  }

  // For all other requests, resolve first then check if it's AppContext
  const resolved = origResolveFilename.call(this, request, parent, isMain, options);
  if (resolved === appContextPath) {
    return origResolveFilename.call(
      this,
      appContextMock,
      parent,
      isMain,
      options,
    );
  }

  return resolved;
};
