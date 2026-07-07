// Test setup: happy-dom environment for SSR rendering
async function setup() {
  const { Window } = await import('happy-dom');
  const window = new Window({ url: 'http://localhost' });
  const document = window.document;

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

  // Mock next/navigation
  const Module = require('module');
  try {
    const navPath = Module._resolveFilename('next/navigation', {
      id: '<preload>',
      filename: '<preload>',
      paths: Module._nodeModulePaths(process.cwd()),
    });
    require.cache[navPath] = {
      id: navPath,
      filename: navPath,
      loaded: true,
      exports: {
        __esModule: true,
        ReadonlyURLSearchParams: class {},
        RedirectType: { push: 'push', replace: 'replace' },
        notFound: () => {},
        redirect: () => {},
        permanentRedirect: () => {},
        useParams: () => ({}),
        usePathname: () => '/',
        useRouter: () => ({ push: () => {}, back: () => {}, replace: () => {}, prefetch: () => {} }),
        useSearchParams: () => new URLSearchParams(),
        useSelectedLayoutSegment: () => null,
        useSelectedLayoutSegments: () => [],
        forbidden: () => { throw new Error('forbidden'); },
        unauthorized: () => { throw new Error('unauthorized'); },
      },
    };
  } catch {
    // next/navigation may not resolve in all environments
  }

  console.log('[test-setup] happy-dom initialized, next/navigation mocked');
}

setup().catch(err => {
  console.error('[test-setup] Error:', err);
  process.exit(1);
});
