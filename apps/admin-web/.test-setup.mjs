// Test setup (ESM): happy-dom environment + module mocks
// Loaded via `node --import ./.test-setup.mjs` before tests

import { Window } from 'happy-dom';
import React from 'react';

const window = new Window({ url: 'http://localhost' });
const document = window.document;

// Some page components use 'use client' with automatic JSX transform but
// the test environment needs React in scope for @testing-library/react renders
globalThis.React = React;

Object.assign(globalThis, {
  window,
  document,
  HTMLElement: window.HTMLElement,
  HTMLInputElement: window.HTMLInputElement,
  HTMLTextAreaElement: window.HTMLTextAreaElement,
  HTMLSelectElement: window.HTMLSelectElement,
  HTMLButtonElement: window.HTMLButtonElement,
  Node: window.Node,
  Element: window.Element,
  self: window,
});

// next/navigation mock via ESM hook
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Module = require('module');

const navPath = Module._resolveFilename('next/navigation', {
  id: '<preload>',
  filename: '<preload>',
  paths: Module._nodeModulePaths(process.cwd()),
});

// Also mock next/link — renders as a plain span
const linkPath = Module._resolveFilename('next/link', {
  id: '<preload>',
  filename: '<preload>',
  paths: Module._nodeModulePaths(process.cwd()),
});

const MockNextLink = ({ children, href, ...props }) => {
  return React.createElement('a', { ...props, 'data-href': href, href }, children);
};

require.cache[linkPath] = {
  id: linkPath,
  filename: linkPath,
  loaded: true,
  exports: { default: MockNextLink, __esModule: true },
};

const mockNavModule = {
  __esModule: true,
  ReadonlyURLSearchParams: class {},
  RedirectType: { push: 'push', replace: 'replace' },
  notFound: () => {},
  redirect: (url) => { throw new Error('redirect: ' + url); },
  permanentRedirect: (url) => { throw new Error('permanentRedirect: ' + url); },
  useParams: () => ({}),
  usePathname: () => '/',
  useRouter: () => ({ push: () => {}, back: () => {}, replace: () => {}, prefetch: () => {} }),
  useSearchParams: () => new URLSearchParams(),
  useSelectedLayoutSegment: () => null,
  useSelectedLayoutSegments: () => [],
  forbidden: () => { throw new Error('forbidden'); },
  unauthorized: () => { throw new Error('unauthorized'); },
};

require.cache[navPath] = {
  id: navPath,
  filename: navPath,
  loaded: true,
  exports: mockNavModule,
};

// Mock next/image
const imagePath = Module._resolveFilename('next/image', {
  id: '<preload>',
  filename: '<preload>',
  paths: Module._nodeModulePaths(process.cwd()),
});

const MockNextImage = ({ src, alt, ...props }) => {
  return React.createElement('img', { ...props, src, alt });
};

require.cache[imagePath] = {
  id: imagePath,
  filename: imagePath,
  loaded: true,
  exports: { default: MockNextImage },
};

console.log('[test-setup] happy-dom initialized (ESM), next/navigation + next/link + next/image mocked');
