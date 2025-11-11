/**
 * jest.config.cjs
 *
 * Jest configuration for server-side/unit tests.
 * - Targets tests under tests/server/**/*.test.ts
 * - Uses ts-jest to handle TypeScript.
 * - Maps Next/TS path aliases (~/ and @/) to the project root.
 *
 * PDPA NOTE:
 * - Tests must not log or snapshot real PHI. Use synthetic data only.
 */

module.exports = {
  testEnvironment: "node",
  // Focus on the new server-side/unit tests
  testMatch: ["<rootDir>/tests/server/**/*.test.ts"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  moduleNameMapper: {
    // Support `@/` imports mapped to project root
    "^@/(.*)$": "<rootDir>/$1",
    // Support `~/` imports mapped to src (adjust if your tsconfig uses a different mapping)
    "^~/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: [],
  // Keep test output lean; rely on explicit assertions, not console noise.
  verbose: false,
};