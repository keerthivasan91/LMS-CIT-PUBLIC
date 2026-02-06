/**
 * Integration Test: Auth Login
 * - Real Express app
 * - Real MySQL DB
 * - Session-based authentication
 * - CI-safe & idempotent
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../../../app");
const pool = require("../../../config/db");

const PASSWORD = "password";
const HASH_ROUNDS = 10;

// Fixed test IDs (namespaced → no collision with prod/dev)
const USERS = {
  ADMIN: "TEST_ADMIN_LOGIN",
  FACULTY: "TEST_FAC_LOGIN",
  STAFF: "TEST_STAFF_LOGIN",
};

async function cleanupUsers() {
  await pool.query(
    "DELETE FROM users WHERE user_id IN (?, ?, ?)",
    [USERS.ADMIN, USERS.FACULTY, USERS.STAFF]
  );
}

describe("Integration: Auth Login", () => {
  beforeEach(async () => {
    await cleanupUsers();

    const hash = await bcrypt.hash(PASSWORD, HASH_ROUNDS);

    await pool.query(
      `INSERT INTO users
       (user_id, name, email, password, role, is_active)
       VALUES (?, ?, ?, ?, ?, 1),
              (?, ?, ?, ?, ?, 1),
              (?, ?, ?, ?, ?, 1)`,
      [
        USERS.ADMIN, "Admin User", "admin_login@test.com", hash, "admin",
        USERS.FACULTY, "Faculty User", "faculty_login@test.com", hash, "faculty",
        USERS.STAFF, "Staff User", "staff_login@test.com", hash, "staff",
      ]
    );
  });

  afterAll(async () => {
    await cleanupUsers();
    await pool.end(); // 🔑 prevents Jest open-handle warning
  });

  /* =====================================================
     TESTS
  ===================================================== */

  test("Login succeeds with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        user_id: USERS.ADMIN,
        password: PASSWORD,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  test("Login fails with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        user_id: USERS.ADMIN,
        password: "wrongpass",
      });

    expect(res.statusCode).toBe(401);
  });

  test("Login fails for inactive user", async () => {
    await pool.query(
      "UPDATE users SET is_active = 0 WHERE user_id = ?",
      [USERS.FACULTY]
    );

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        user_id: USERS.FACULTY,
        password: PASSWORD,
      });

    expect(res.statusCode).toBe(403);
  });

  test("Login fails with missing fields", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        user_id: USERS.ADMIN,
      });

    expect(res.statusCode).toBe(400);
  });
});
