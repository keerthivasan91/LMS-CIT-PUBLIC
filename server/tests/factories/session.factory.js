/**
 * Session Factory
 * Used for session-based authentication tests (NO JWT)
 */

/**
 * Build a mock session object
 * Used for unit tests (middleware, controllers)
 */
function buildSession(overrides = {}) {
  return {
    user: {
      id: overrides.userId || 1,
      email: overrides.email || "test.user@lms.local",
      role: overrides.role || "FACULTY",
    },
    isAuthenticated: true,
    ...overrides.extra,
  };
}

/**
 * Attach session to Supertest agent
 * Used for integration & e2e tests
 */
async function loginAs(agent, user) {
  /**
   * Assumes you already have a test-only login route
   * OR real /auth/login route works in test env
   */

  await agent
    .post("/api/auth/login")
    .send({
      email: user.email || "test.user@lms.local",
      password: user.password || "test_password",
    })
    .expect(200);

  return agent; // agent now has session cookie
}

module.exports = {
  buildSession,
  loginAs,
};
