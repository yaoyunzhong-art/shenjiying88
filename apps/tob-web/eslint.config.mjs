import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import rootConfig from '../../eslint.config.mjs';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
  baseDirectory: currentDir
});

export default [
  ...rootConfig,
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Disable react-hooks rules due to flat config compatibility issues
      // with eslint-plugin-react-hooks older versions
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/rules-of-hooks': 'off',
      // allow require() style imports — commonly used in Next.js config files
      '@typescript-eslint/no-require-imports': 'off',
      // allow any — used in tests and external API integration
      '@typescript-eslint/no-explicit-any': 'off',
      // allow unescaped entities in JSX
      'react/no-unescaped-entities': 'off',
      // docs-center intentionally uses <a> for external doc links
      '@next/next/no-html-link-for-pages': 'off',
      // allow lexical declarations in switch case blocks
      'no-case-declarations': 'off',
      // allow console.error for logging (intentional in service layers)
      'no-console': 'off',
    },
  },
];
