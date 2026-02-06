/**
 * Jest configuration for LMS Backend
 * CI-safe, DB-safe, production-hardened
 */

module.exports = {
  // Root = server/
  rootDir: "../../",

  testEnvironment: "node",

  // Explicit test patterns
  testMatch: [
    "<rootDir>/tests/**/*.unit.test.js",
    "<rootDir>/tests/**/*.int.test.js",
    "<rootDir>/tests/**/*.e2e.test.js",
  ],

  /**
   * 🔥 Runs BEFORE any imports (app.js, db.js, etc.)
   * Order matters:
   * 1. timers.js  -> neutralize setInterval
   * 2. env.test.js -> load env
   */
  setupFiles: [
    "<rootDir>/tests/setup/timers.js",
    "<rootDir>/tests/config/env.test.js",
  ],

  /**
   * Runs AFTER Jest environment is ready
   */
  setupFilesAfterEnv: [
    "<rootDir>/tests/setup/setup.js",
  ],

  // Global teardown (DB, servers, queues)
  globalTeardown: "<rootDir>/tests/jest.teardown.js",


  // Coverage
  collectCoverage: true,
  coverageDirectory: "<rootDir>/tests/coverage",
  coverageProvider: "v8",
  collectCoverageFrom: [
    "<rootDir>/**/*.js",
    "!<rootDir>/node_modules/**",
    "!<rootDir>/tests/**",
    "!<rootDir>/logs/**",
    "!<rootDir>/coverage/**",
    "!<rootDir>/**/index.js",
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Timeouts (DB + E2E)
  testTimeout: 30000,

  // Isolation & safety
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false,

  // Debugging & stability
  detectOpenHandles: true,
  forceExit: false,

  // CI friendly
  verbose: true,
  maxWorkers: process.env.CI ? "50%" : "100%",

  testPathIgnorePatterns: [
    "/node_modules/",
    "/coverage/",
  ],
};
