import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '*.cjs', 'tests/**/*', 'templates/**/*', 'v2-features/**/*'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      react,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // React-specific rules
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      'react/prop-types': 'off', // Using TypeScript instead
      'react/jsx-uses-react': 'off', // Not needed with React 17+
      'react/jsx-uses-vars': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-fragments': ['error', 'syntax'],
      'react/no-unescaped-entities': 'warn',

      // TypeScript-specific rules - warn for unused vars during cleanup phase
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-constant-condition': 'warn', // Allow constant conditions

      // Accessibility rules - downgrade some to warn for gradual improvement
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn', // Gradual fix
      'jsx-a11y/no-autofocus': 'warn', // Allow autofocus in specific cases

      // General code quality
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-case-declarations': 'warn', // Allow declarations in switch cases
      'no-empty-pattern': 'warn', // Gradual fix
      '@typescript-eslint/ban-ts-comment': 'warn', // Allow @ts-ignore during migration
      'no-prototype-builtins': 'warn', // Allow hasOwnProperty
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  prettier, // Must be last to override other configs
)
