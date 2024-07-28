module.exports = {
    collectCoverage: true,
    coverageThreshold: {
      global: {
        branches: 30,
        functions: 30,
        lines: 30,
        statements: 30,
      },
    },
    coverageReporters: ['text', 'lcov'],
    setupFilesAfterEnv: ['./jest.setup.js'], 
    testEnvironment: 'node',
    testMatch: ['**/*.test.js'],
  };
  