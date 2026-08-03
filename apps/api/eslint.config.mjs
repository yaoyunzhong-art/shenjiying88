import rootConfig from '../../eslint.config.mjs';

export default [
  ...rootConfig,
  {
    rules: {
      'no-regex-spaces': 'off',
      'no-empty': 'off',
      'no-constant-condition': 'off',
      'no-unused-labels': 'off',
      'no-useless-escape': 'off',
      'no-prototype-builtins': 'off',
      'no-case-declarations': 'off',
      'no-irregular-whitespace': 'off',
      'no-unexpected-multiline': 'off',
      'no-async-promise-executor': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-declaration-merging': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      'no-console': 'off',
    },
  },
];
