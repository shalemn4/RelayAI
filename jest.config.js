module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^react-native$': 'react-native-web',
    '^@relay-ai/types$': '<rootDir>/packages/types/src',
    '^@relay-ai/validation$': '<rootDir>/packages/validation/src',
    '^@/(.*)$': '<rootDir>/apps/mobile/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        jsx: 'react',
        esModuleInterop: true,
      },
    }],
  },
};
