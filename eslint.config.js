import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

// Regole di lint per tutto il progetto: JavaScript e TypeScript "consigliate",
// più le regole dei React hooks solo per il frontend.
export default defineConfig([
  { ignores: ['**/dist/**', '**/node_modules/**', 'server/src/generated/**'] },

  js.configs.recommended,
  tseslint.configs.recommended,

  {
    rules: {
      // Un parametro o una variabile che inizia con "_" è volutamente inutilizzato
      // (es. il quarto parametro dei gestori di errore Express).
      // ignoreRestSiblings permette `const { passwordHash: _hash, ...rest } = user`
      // per togliere un campo da un oggetto.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },

  {
    files: ['server/**/*.ts', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['client/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    extends: [reactHooks.configs.flat.recommended],
  },
]);
