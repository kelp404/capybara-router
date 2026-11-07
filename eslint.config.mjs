import {fileURLToPath} from 'node:url';
import {includeIgnoreFile} from '@eslint/compat';
import babelParser from '@babel/eslint-parser';
import xoSpace from 'eslint-config-xo/space';
import xoReact from 'eslint-config-xo-react';
import importPlugin from 'eslint-plugin-import';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';

export default [
  includeIgnoreFile(fileURLToPath(new URL('.gitignore', import.meta.url))),
  {
    ignores: ['example/web.js'],
  },
  ...xoSpace,
  ...xoReact({space: true}),
  {
    languageOptions: {
      parser: babelParser,
      globals: {
        ...globals.browser,
        ...globals.commonjs,
        ...globals.node,
        jest: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: {
      import: importPlugin,
      jsdoc,
    },
    rules: {
      'no-eq-null': 'off',
      eqeqeq: ['error', 'allow-null'],

      // Backport fixes from eslint-config-xo 1.x, which requires ESLint 10.
      // xo 0.49 `space` config leaves `indent-binary-ops` on tabs, and `curly-newline: always` rejects empty blocks `{}`.
      '@stylistic/indent-binary-ops': ['error', 2],
      '@stylistic/curly-newline': ['error', {consistent: true}],

      // Babel compiles JSX with the classic runtime (React.createElement), so React must be in scope.
      // xo-react 0.30 disabled this rule for the new JSX transform.
      'react/react-in-jsx-scope': 'error',

      // Replace `valid-jsdoc` which was removed in ESLint 9, keeping its default options.
      // https://github.com/gajus/eslint-plugin-jsdoc
      'jsdoc/check-param-names': 'error',
      'jsdoc/require-param': 'error',
      'jsdoc/require-param-name': 'error',
      'jsdoc/require-param-type': 'error',
      'jsdoc/require-param-description': 'error',
      'jsdoc/require-returns': ['error', {forceRequireReturn: true}],
      'jsdoc/require-returns-type': 'error',
      'jsdoc/require-returns-description': 'error',
      'jsdoc/valid-types': 'error',

      // Ensure absolute imports are above relative imports and that unassigned imports are ignored
      // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/order.md
      'import/order': ['error', {groups: [['builtin', 'external', 'internal']]}],

      // Require a newline after the last import/require in a group
      // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/newline-after-import.md
      'import/newline-after-import': 'error',
    },
  },
];
