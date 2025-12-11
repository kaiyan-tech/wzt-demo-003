import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

const sharedIgnores = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.turbo/**', '**/fc-deploy/**'];

const sharedRules = {
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/no-explicit-any': 'warn',
};

/**
 * 创建基础 ESLint 配置
 */
export function createBaseConfig({
  ignores = [],
  globals: extraGlobals = {},
  typeChecked = false,
  parserOptions,
  rules = {},
} = {}) {
  const tsConfigs = typeChecked ? tseslint.configs.recommendedTypeChecked : tseslint.configs.recommended;
  const parserOptionsConfig =
    typeChecked && parserOptions
      ? {
          project: parserOptions.project,
          tsconfigRootDir: parserOptions.tsconfigRootDir,
        }
      : undefined;

  return tseslint.config(
    { ignores: [...sharedIgnores, ...ignores] },
    js.configs.recommended,
    ...tsConfigs,
    eslintConfigPrettier,
    {
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        globals: {
          ...globals.es2022,
          ...extraGlobals,
        },
        ...(parserOptionsConfig ? { parserOptions: parserOptionsConfig } : {}),
      },
      rules: {
        ...sharedRules,
        ...rules,
      },
    },
  );
}

export const baseConfig = createBaseConfig();

export default baseConfig;
