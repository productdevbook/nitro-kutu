import antfu from '@antfu/eslint-config'
import unjs from 'eslint-config-unjs'

export default antfu(
  {
    plugins: [
      unjs(),
    ],
    ignores: [
      '**/.nuxt',
      '**/.nitro',
    ],
    rules: {
      'unicorn/prefer-top-level-await': 0,
      'unicorn/no-empty-file': 0,
    },
  },
  {
    ignores: [
      'dist',
      '.github',
      'node_modules',
      'public',
      'coverage',
      'storybook-static',
      '.nuxt',
      '*.md',
      '*.d.ts',
      '.nx',
      '.vitest-cache',
      '__snapshots__',
      '.docs',
      'packages/core/src/index.ts',
    ],
  },
  {
    rules: {
      'node/prefer-global/process': 'off',
      'ts/consistent-type-definitions': 'off',
      'ts/no-unused-expressions': 'off',
      '@typescript-eslint/prefer-interface': 'off',
    },
  },
  {
    files: [
      '**/*.vue',
    ],
    rules: {
      'import/first': 'off',
      'import/order': 'off',
      'vue/block-tag-newline': 'off',
    },
  },
)
