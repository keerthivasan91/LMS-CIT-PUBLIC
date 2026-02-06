/**
 * Integration Test: Admin Reset Password (Final)
 * - Real Express app
 * - Real MySQL test DB
 * - Session-based authentication
 * - CI safe & isolated
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../../../app");
const pool = require("../../../config/db");

const ADMIN_ID = "TEST_RESET_ADMIN";
const FACULTY_ID = "TEST_RESET_FAC";
const ADMIN_PASS = "adminpass";
const OLD_PASS = "oldpass";

async function cleanup() {
  await pool.query(
    "DELETE FROM users WHERE user_id IN (?, ?)",
    [ADMIN_ID, FACULTY_ID]
  );
}

describe("Integration: Admin Reset Password (Final)", () => {
  let adminAgent;

  beforeEach(async () => {
    await cleanup();

    const adminHash = await bcrypt.hash(ADMIN_PASS, 10);
    const facultyHash = await bcrypt.hash(OLD_PASS, 10);

    /* ============ Seed ADMIN ============ */
    await pool.query(
      `INSERT INTO users
       (user_id, name, email, password, role, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [
        ADMIN_ID,
        "Reset Admin",
        "reset_admin@test.com",
        adminHash,
        "admin",
      ]
    );

    /* ============ Seed FACULTY ============ */
    await pool.query(
      `INSERT INTO users
       (user_id, name, email, password, role, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [
        FACULTY_ID,
        "Reset Faculty",
        "reset_fac@test.com",
        facultyHash,
        "faculty",
      ]
    );

    /* ============ Login ADMIN ============ */
    adminAgent = request.agent(app);
    const loginRes = await adminAgent.post("/api/auth/login").send({
      user_id: ADMIN_ID,
      password: ADMIN_PASS,
    });

    expect(loginRes.statusCode).toBe(200);
  });

  afterAll(async () => {
    await cleanup();
    await pool.end(); // 🔑 prevents Jest hanging
  });

  /* =====================================================
     TESTS
  ===================================================== */

  test("Admin can reset password using reset-password-final", async () => {
    const res = await adminAgent
      .post("/api/admin/reset-password-final")
      .send({
        user_id: FACULTY_ID,
        new_password: "newpass123",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/password/i);

    // Verify password actually changed
    const [[row]] = await pool.query(
      "SELECT password FROM users WHERE user_id = ?",
      [FACULTY_ID]
    );

    const isValid = await bcrypt.compare("newpass123", row.password);
    expect(isValid).toBe(true);
  });

  test("Reset fails for non-existent user", async () => {
    const res = await adminAgent
      .post("/api/admin/reset-password-final")
      .send({
        user_id: "NO_SUCH_USER",
        new_password: "test123",
      });

    expect([400, 404]).toContain(res.statusCode);
  });

  test("Reset fails with missing fields", async () => {
    const res = await adminAgent
      .post("/api/admin/reset-password-final")
      .send({
        user_id: FACULTY_ID,
      });

    expect(res.statusCode).toBe(400);
  });
});
