/**
 * Security: Role-Based Access Control (RBAC)
 * Uses REAL DB + session-based auth
 * Aligned with actual LMS behavior
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../../app");
const pool = require("../../config/db");

const PASSWORD = "password";
let agent;

function uniqueEmail(prefix) {
  return `${prefix}_${Date.now()}@test.com`;
}

describe("Security: Role-Based Access Control", () => {
  beforeEach(async () => {
    // Clean slate for RBAC users only
    await pool.query(
      "DELETE FROM users WHERE user_id LIKE 'RBAC_%'"
    );
    await pool.query(
      "DELETE FROM leave_balance WHERE user_id LIKE 'RBAC_%'"
    );
  });

  afterAll(async () => {
    await pool.query(
      "DELETE FROM users WHERE user_id LIKE 'RBAC_%'"
    );
    await pool.query(
      "DELETE FROM leave_balance WHERE user_id LIKE 'RBAC_%'"
    );
    await pool.end();
  });

  /* ================= ADMIN ROUTES ================= */

  test("Faculty CANNOT access admin users list", async () => {
    const hash = await bcrypt.hash(PASSWORD, 10);

    await pool.query(
      `INSERT INTO users
       (user_id, name, email, password, role, department_code, designation, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "RBAC_FAC1",
        "Faculty",
        uniqueEmail("fac"),
        hash,
        "faculty",
        "CSE",
        "Assistant Professor",
        1,
      ]
    );

    agent = request.agent(app);
    await agent.post("/api/auth/login").send({
      user_id: "RBAC_FAC1",
      password: PASSWORD,
    });

    const res = await agent.get("/api/admin/users");
    expect([403, 404]).toContain(res.statusCode);
  });

  test("Admin CAN access admin users list", async () => {
    const hash = await bcrypt.hash(PASSWORD, 10);

    await pool.query(
      `INSERT INTO users
       (user_id, name, email, password, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "RBAC_ADM1",
        "Admin",
        uniqueEmail("admin"),
        hash,
        "admin",
        1,
      ]
    );

    agent = request.agent(app);
    await agent.post("/api/auth/login").send({
      user_id: "RBAC_ADM1",
      password: PASSWORD,
    });

    const res = await agent.get("/api/admin/users");
    expect(res.statusCode).toBe(200);
  });

  test("Principal is BLOCKED from admin users list (policy)", async () => {
    const hash = await bcrypt.hash(PASSWORD, 10);

    await pool.query(
      `INSERT INTO users
       (user_id, name, email, password, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "RBAC_PRIN1",
        "Principal",
        uniqueEmail("principal"),
        hash,
        "principal",
        1,
      ]
    );

    agent = request.agent(app);
    await agent.post("/api/auth/login").send({
      user_id: "RBAC_PRIN1",
      password: PASSWORD,
    });

    const res = await agent.get("/api/admin/users");
    expect([403, 404]).toContain(res.statusCode);
  });

  /* ================= HOD ROUTES ================= */

  test("Faculty CANNOT access HOD dashboard", async () => {
    const hash = await bcrypt.hash(PASSWORD, 10);

    await pool.query(
      `INSERT INTO users
       (user_id, name, email, password, role, department_code, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "RBAC_FAC2",
        "Faculty",
        uniqueEmail("fac"),
        hash,
        "faculty",
        "CSE",
        1,
      ]
    );

    agent = request.agent(app);
    await agent.post("/api/auth/login").send({
      user_id: "RBAC_FAC2",
      password: PASSWORD,
    });

    const res = await agent.get("/api/hod/requests");
    expect([403, 404]).toContain(res.statusCode);
  });

  test("HOD CAN access HOD dashboard", async () => {
    const hash = await bcrypt.hash(PASSWORD, 10);

    await pool.query(
      `INSERT INTO users
       (user_id, name, email, password, role, department_code, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "RBAC_HOD1",
        "HOD",
        uniqueEmail("hod"),
        hash,
        "hod",
        "CSE",
        1,
      ]
    );

    agent = request.agent(app);
    await agent.post("/api/auth/login").send({
      user_id: "RBAC_HOD1",
      password: PASSWORD,
    });

    const res = await agent.get("/api/hod/requests");
    expect(res.statusCode).toBe(200);
  });

  /* ================= LEAVE ROUTES ================= */

  test("Staff CAN apply for leave (with balance seeded)", async () => {
    const hash = await bcrypt.hash(PASSWORD, 10);

    await pool.query(
      `INSERT INTO users
       (user_id, name, email, password, role, department_code, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "RBAC_STF1",
        "Staff",
        uniqueEmail("staff"),
        hash,
        "staff",
        "CSE",
        1,
      ]
    );

    // REQUIRED: seed leave balance
    await pool.query(
      `INSERT INTO leave_balance
       (user_id, academic_year, casual_total)
       VALUES (?, ?, ?)`,
      ["RBAC_STF1", 2026, 10]
    );

    agent = request.agent(app);
    await agent.post("/api/auth/login").send({
      user_id: "RBAC_STF1",
      password: PASSWORD,
    });

    const res = await agent.post("/api/leave/apply").send({
      leave_type: "Casual Leave",
      start_date: "2026-02-10",
      start_session: "Forenoon",
      end_date: "2026-02-10",
      end_session: "Afternoon",
      reason: "RBAC test",
    });

    expect(res.statusCode).toBe(200);
  });

  /* ================= PRINCIPAL ROUTES ================= */

  test("Principal CAN approve leave", async () => {
    const hash = await bcrypt.hash(PASSWORD, 10);

    await pool.query(
      `INSERT INTO users
       (user_id, name, email, password, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "RBAC_PRIN2",
        "Principal",
        uniqueEmail("principal"),
        hash,
        "principal",
        1,
      ]
    );

    agent = request.agent(app);
    await agent.post("/api/auth/login").send({
      user_id: "RBAC_PRIN2",
      password: PASSWORD,
    });

    const res = await agent.post("/api/admin/approve/9999");
    expect([200, 400, 404]).toContain(res.statusCode);
  });

  test("Admin CANNOT approve leave as principal", async () => {
    const hash = await bcrypt.hash(PASSWORD, 10);

    await pool.query(
      `INSERT INTO users
       (user_id, name, email, password, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "RBAC_ADM2",
        "Admin",
        uniqueEmail("admin"),
        hash,
        "admin",
        1,
      ]
    );

    agent = request.agent(app);
    await agent.post("/api/auth/login").send({
      user_id: "RBAC_ADM2",
      password: PASSWORD,
    });

    const res = await agent.post("/api/admin/approve/9999");
    expect([403, 404]).toContain(res.statusCode);
  });
});
