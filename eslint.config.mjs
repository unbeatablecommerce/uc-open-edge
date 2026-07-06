import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.svelte-kit/**',
      '**/build/**',
      '**/.prisma/**',
      '**/prisma/migrations/**',
    ],
  },
  // TypeScript files that are part of a tsconfig project
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: [
      // These config files live outside the package src/ dirs and are not
      // included in any tsconfig's "include" array, so we skip project-based
      // type-checking for them to avoid parserOptions.project errors.
      '**/vitest.config.ts',
      '**/*.config.ts',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  // Config files (vitest.config.ts, vite.config.ts, etc.) — no project-based type checking
  {
    files: ['**/vitest.config.ts', '**/*.config.ts', '**/*.config.mjs'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: false,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // consistent-type-imports requires project info — skip for config files
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  // Svelte files
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
      },
    },
    plugins: {
      svelte: sveltePlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...sveltePlugin.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'off', // prettier-plugin-svelte handles this via pnpm format
    },
  },
];
