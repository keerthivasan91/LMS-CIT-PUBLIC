/**
 * Integration Test: Admin Create User
 * - Real Express app
 * - Real MySQL test DB
 * - Session-based authentication
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../../../app");
const pool = require("../../../config/db");

let adminAgent;
let facultyAgent;

describe("Integration: Admin Create User", () => {
  beforeAll(async () => {
    // Clean up seed users (idempotent)
    await pool.query(
      "DELETE FROM users WHERE user_id IN ('ADMIN01','FAC111','FAC900','FAC901','FAC300')"
    );

    const passwordHash = await bcrypt.hash("password", 10);

    /* ================= Seed ADMIN ================= */
    await pool.query(
      `INSERT INTO users
       (user_id, name, email, password, role, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      ["ADMIN01", "Admin User", "admin@test.com", passwordHash, "admin"]
    );

    /* ================= Seed FACULTY ================= */
    await pool.query(
      `INSERT INTO users
       (user_id, name, email, password, role, department_code, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      ["FAC111", "Faculty User", "fac@test.com", passwordHash, "faculty", "CSE"]
    );

    /* ================= Login ADMIN ================= */
    adminAgent = request.agent(app);
    const adminLogin = await adminAgent.post("/api/auth/login").send({
      user_id: "ADMIN01",
      password: "password",
    });
    expect(adminLogin.statusCode).toBe(200);

    /* ================= Login FACULTY ================= */
    facultyAgent = request.agent(app);
    const facultyLogin = await facultyAgent.post("/api/auth/login").send({
      user_id: "FAC111",
      password: "password",
    });
    expect(facultyLogin.statusCode).toBe(200);
  });

  afterEach(async () => {
    // Cleanup users created by tests
    await pool.query(
      "DELETE FROM users WHERE user_id IN ('FAC900','FAC901','FAC300')"
    );
  });

  /* =====================================================
     TESTS
  ===================================================== */

  test("Admin can create user", async () => {
    const res = await adminAgent.post("/api/add-user").send({
      user_id: "FAC900",
      name: "Test Faculty",
      email: "fac900@test.com",
      password: "password",
      role: "faculty",
      department_code: "CSE",
      designation: "Assistant Professor",
      phone: "9999999999",
      date_joined: "2024-06-01",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/success/i);
  });

  test("Duplicate user rejected", async () => {
    const passwordHash = await bcrypt.hash("password", 10);

    await pool.query(
      `INSERT INTO users
       (user_id, name, email, password, role, department_code, designation, phone, date_joined, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        "FAC901",
        "Duplicate User",
        "dup@test.com",
        passwordHash,
        "faculty",
        "CSE",
        "Assistant Professor",
        "9999999999",
        "2024-01-01",
      ]
    );

    const res = await adminAgent.post("/api/add-user").send({
      user_id: "FAC901",
      name: "Duplicate User",
      email: "dup@test.com",
      password: "password",
      role: "faculty",
      department_code: "CSE",
      designation: "Assistant Professor",
      phone: "9999999999",
      date_joined: "2024-01-01",
    });

    expect(res.statusCode).toBe(409);
  });

  test("Missing fields rejected", async () => {
    const res = await adminAgent.post("/api/add-user").send({
      name: "Invalid User",
    });

    expect(res.statusCode).toBe(400);
  });

  test("Non-admin blocked", async () => {
    const res = await facultyAgent.post("/api/add-user").send({
      user_id: "FAC300",
      name: "Blocked User",
      email: "blocked@test.com",
      password: "password",
      role: "faculty",
      department_code: "CSE",
      designation: "Assistant Professor",
      phone: "9999999999",
      date_joined: "2024-01-01",
    });

    expect(res.statusCode).toBe(403);
  });
});
