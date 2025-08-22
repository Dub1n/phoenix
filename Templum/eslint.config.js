// Simple ESLint configuration for TypeScript
module.exports = [
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    rules: {
      'no-unused-vars': 'warn',
      'prefer-const': 'error',
      'no-var': 'error'
    }
  }
];