import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import rootConfig from '../../eslint.config.mjs';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
  baseDirectory: currentDir
});

export default [...rootConfig, ...compat.extends('next/core-web-vitals', 'next/typescript')];
