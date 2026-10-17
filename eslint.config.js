import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import architecture from './eslint-rules/one-function-per-file.js';

export default tseslint.config(
  { ignores: ['dist', 'legacy', 'coverage', 'data'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2023, globals: globals.browser },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/no-multi-comp': ['error', { ignoreStateless: false }],
    },
  },
  {
    // Component files: exactly one top-level function (see eslint-rules/).
    files: ['src/**/*.tsx'],
    plugins: { architecture },
    rules: { 'architecture/one-function-per-file': 'error' },
  },
  {
    files: ['*.config.{js,ts}', 'eslint-rules/**/*.js', 'scripts/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
