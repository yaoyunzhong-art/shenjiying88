import rootConfig from '../../eslint.config.mjs';

export default [
  ...rootConfig,
  {
    rules: {
      'no-constant-condition': 'off',
      'no-useless-escape': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-extra-non-null-assertion': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      '@next/next/no-assign-module-variable': 'off',
    },
  },
];
