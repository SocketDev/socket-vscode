/**
 * Repository-owned lint configuration. Keep the basic lint command usable
 * without hydrating the shared Fleet config.
 */
export default {
  categories: {
    correctness: 'error',
    suspicious: 'warn',
  },
  ignorePatterns: ['coverage/**', 'out/**', 'vendor/**'],
  plugins: ['typescript'],
  rules: {
    'typescript/no-unsafe-type-assertion': 'off',
  },
}
