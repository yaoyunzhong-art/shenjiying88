/**
 * Vite plugin: strip Flow type annotations from react-native modules
 * during vitest SSR transform, so rolldown can parse the JS without errors.
 */
import type { Plugin } from 'vite';

export function flowStripPlugin(): Plugin {
  return {
    name: 'vitest-flow-strip',
    enforce: 'pre',
    transform(code: string, id: string) {
      if (!id.includes('react-native') || (!id.endsWith('.js') && !id.endsWith('.jsx'))) return;

      console.log('[flow-strip] transforming:', id.substring(id.length - 80));

      // Strip `/* @flow */` pragma
      let transformed = code.replace(/\/\*\s*@flow[\s\S]*?\*\//g, '/* flow stripped */');

      // Replace `import typeof X from` → `import type X from` (fails anyway but let's try)
      transformed = transformed.replace(/import\s+typeof\s+/g, 'import type ');

      return { code: transformed, map: null };
    },
  };
}
