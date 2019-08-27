module.exports = {
  verbose: true,
  browser: false,
  testEnvironment: 'node',
  transform: {},
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/coverage/**',
  ],
  globals: {
  }
}
