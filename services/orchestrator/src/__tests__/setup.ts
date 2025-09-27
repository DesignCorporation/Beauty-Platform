/**
 * Jest Test Setup
 * Global test configuration and mocks
 */

// Mock process.env for consistent test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '8080';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000);