import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import { createBaseConfig } from '../../eslint.config.mjs';

const baseConfig = createBaseConfig({
  globals: {
    ...globals.browser,
  },
});

export default [
  ...baseConfig,
  // React 前端配置
  {
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  // 特定文件豁免
  {
    files: ['src/contexts/AuthContext.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
];
