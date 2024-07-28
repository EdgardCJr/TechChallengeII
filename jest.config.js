module.exports = {
    collectCoverage: true,
    coverageThreshold: {
      global: {
        branches: 10,
        functions: 10,
        lines: 10,
        statements: 10,
      },
    },
    coverageReporters: ['text', 'lcov'],
    setupFilesAfterEnv: ['./jest.setup.js'], 
    testEnvironment: 'node',
    testMatch: ['**/*.test.js'],
  };
  