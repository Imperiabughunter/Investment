export default {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'prettier',
  ],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  overrides: [
    {
      files: ['apps/web/**/*'],
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'prettier',
      ],
      settings: {
        react: {
          version: 'detect',
        },
      },
    },
    {
      files: ['apps/mobile/**/*'],
      extends: [
        'expo',
        '@typescript-eslint/recommended',
        'plugin:react-native/all',
        'prettier',
      ],
      env: {
        'react-native/react-native': true,
      },
    },
    {
      files: ['apps/api/**/*'],
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        'prettier',
      ],
      env: {
        node: true,
      },
    },
    {
      files: ['packages/**/*'],
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        'prettier',
      ],
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.expo/',
    '.next/',
    '.turbo/',
    '.vite/',
    '.metro-cache/',
    'coverage/',
    '*.config.js',
    '*.config.ts',
  ],
};
