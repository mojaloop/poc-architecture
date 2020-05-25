module.exports = {
  // parser: '@typescript-eslint/parser',
  extends: 'standard-with-typescript',
  parserOptions: {
    sourceType: 'module', // Allows for the use of imports
    project: './tsconfig.json'
  },
  rules: {
    'no-async-promise-executor': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off'
    // '@typescript-eslint/no-explicit-any': 'off',
    // '@typescript-eslint/no-var-requires': 'off'
    // '@typescript-eslint/no-inferrable-types': 'off'
  },
  overrides: [
    {
      // Disable some rules that we abuse in unit tests.
      files: ['test/**/*.ts'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off'
      }
    }
  ]
}
