// root eslint config for @m5 monorepo
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/__e2e__/.disabled/**',
      '**/build/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/web-build/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // Next.js 插件 — 仅 Next.js 应用目录（admin-web / storefront-web / tob-web）
  {
    files: ['apps/admin-web/**', 'apps/storefront-web/**', 'apps/tob-web/**'],
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@next/next/no-html-link-for-pages': 'off',
    },
    settings: {
      next: { rootDir: ['apps/*/'] },
    },
  },
  // 全局规则覆盖
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': 'off', // 由 @typescript-eslint/no-unused-vars 处理
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-console': 'warn',
      'no-undef': 'off', // TS 已经能识别类型
      '@typescript-eslint/no-explicit-any': 'off', // 测试 stub 中常用 any
      '@typescript-eslint/no-unsafe-function-type': 'off', // Function 类型在 React Native legacy code 中常见
      '@typescript-eslint/no-unused-expressions': 'off', // 由 typescript-eslint v8 推荐的严格模式引入，预期行为如 expect().to...
      'no-constant-binary-expression': 'off', // eslint 9 新规则，部分测验/断言中常量左值有预期用途
      '@typescript-eslint/triple-slash-reference': 'off', // 类型声明文件引用方式，测试环境中需要
      'prefer-const': 'off', // eslint 9 强制更严格的 prefer-const，存量代码中 let 用于语义清晰度
      'no-var': 'off', // eslint 9 对 var 零容忍，存量 tsx/declaration 文件中 var 有特定用途
      '@typescript-eslint/ban-ts-comment': 'off', // 存量 @ts-expect-error 无描述
      'no-regex-spaces': 'off', // 存量正则中用空格对齐可读性
      'no-empty': 'off', // 存量空 catch 块有明确意图
      'no-prototype-builtins': 'off', // eslint 9 强制 Object.hasOwn 但存量代码用 hasOwnProperty
      'no-case-declarations': 'off', // 存量 switch case 中有词法声明
      'no-irregular-whitespace': 'off', // 存量文件中的非常规空白字符
      'no-unexpected-multiline': 'off', // eslint 9 新规则
      'no-async-promise-executor': 'off', // 存量 async Promise executor
      'no-constant-condition': 'off', // eslint 9 严格化，存量条件中有常量
      'no-useless-escape': 'off', // eslint 9 检测更精确，存量转义符
      'no-unused-labels': 'off', // eslint 9 新规则
      '@typescript-eslint/no-empty-object-type': 'off', // 存量空接口作为类型的占位符
      '@typescript-eslint/no-unsafe-declaration-merging': 'off', // NestJS class+interface 合并模式
      '@typescript-eslint/no-extra-non-null-assertion': 'off', // 存量多级非空断言
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off', // 存量可选链+非空断言组合
      '@typescript-eslint/no-require-imports': 'off', // 根级别统一关闭，test 例外在下方单独处理
      '@next/next/no-assign-module-variable': 'off', // Next.js 覆盖 Module 变量的测试场景
    },
  },
  // 测试文件:tsx/esbuild 不 emit decorator metadata,常需 require() 绕过加载时机
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', '**/*.e2e.test.ts', '**/__tests__/**', '**/__test_*', '**/test/**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'react-hooks/rules-of-hooks': 'off', // 测试 mock 中 hooks 可能条件调用
    },
  },
];
