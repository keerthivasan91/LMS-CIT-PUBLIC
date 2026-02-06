/**
 * Global Jest setup
 */

// 🔥 MUST run before app/db imports
jest.spyOn(global, "setInterval").mockImplementation(() => {
  return { unref: () => {} };
});

// 🔥 Mock mailer ONLY (DB must be real for integration tests)
jest.mock("../../server/config/mailer");

// Increase timeout
jest.setTimeout(30000);

beforeAll(() => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("❌ Jest running outside test env");
  }
});
