module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  testMatch: ['**/*.test.ts'],

  roots: ['<rootDir>/test'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
};

