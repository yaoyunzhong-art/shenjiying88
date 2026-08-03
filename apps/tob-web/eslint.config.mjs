import rootConfig from '../../eslint.config.mjs';

export default [
  ...rootConfig,
  {
    rules: {
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/rules-of-hooks': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-html-link-for-pages': 'off',
      'no-case-declarations': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@next/next/no-img-element': 'off',
      'no-useless-escape': 'off',
    },
  },
];
