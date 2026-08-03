import rootConfig from '../../eslint.config.mjs';

export default [
  ...rootConfig,
  {
    rules: {
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      'no-constant-condition': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-useless-escape': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
