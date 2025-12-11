import globals from 'globals';
import { createBaseConfig } from '../../eslint.config.mjs';

const baseConfig = createBaseConfig({
  typeChecked: true,
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: import.meta.dirname,
  },
  globals: {
    ...globals.node,
    ...globals.jest,
  },
  ignores: ['test/**', 'prisma/**'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
  },
});

export default [
  ...baseConfig,
  // 测试文件放宽类型检查（Jest mock 返回 any 类型）
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
];
