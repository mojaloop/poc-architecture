module.exports = {
  extends: 'standard-with-typescript',
  parserOptions: {
    sourceType: 'module', // Allows for the use of imports
    project: './tsconfig.json'
  },
  rules: {
    'no-async-promise-executor': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        'checksVoidReturn': true // Setting this to 'false' resolves - Error: Promise returned in function argument where a void return was expected  @typescript-eslint/no-misused-promises. This should be removed when productionized.
      }
    ]
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
