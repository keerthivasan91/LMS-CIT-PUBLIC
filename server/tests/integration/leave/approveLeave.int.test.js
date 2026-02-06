/**
 * Integration Test: Approve Leave
 *
 * FLOWS
 * 1) WITH substitute   : Substitute → HOD → Principal
 * 2) WITHOUT substitute: HOD → Principal
 *
 * Reuses /api/apply (ground truth from applyLeave.int.test.js)
 * Real Express app, real MySQL test DB, session-based auth
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../../../app");
const pool = require("../../../config/db");

describe("Integration: Approve Leave", () => {
  let facultyAgent;
  let substituteAgent;
  let hodAgent;
  let principalAgent;

  let leaveIdWithSub;
  let arrangementId;

  let leaveIdWithoutSub;

  beforeAll(async () => {
    /* =====================================================
       CLEANUP (IDEMPOTENT)
    ===================================================== */
    await pool.query("DELETE FROM arrangements");
    await pool.query("DELETE FROM leave_requests");
    await pool.query(
      "DELETE FROM users WHERE user_id IN ('FAC501','SUB501','HOD501','PRIN501')"
    );
    await pool.query("DELETE FROM leave_balance WHERE user_id = 'FAC501'");

    const hash = await bcrypt.hash("password", 10);

    /* =====================================================
       SEED USERS
    ===================================================== */
    await pool.query(
      `INSERT INTO users
       (user_id, name, email, password, role, department_code, designation, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["FAC501", "Faculty User", "fac501@test.com", hash, "faculty", "CSE", "Assistant Professor", 1]
    );

    await pool.query(
      `INSERT INTO users
       (user_id, name, email, password, role, department_code, designation, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["SUB501", "Sub User", "sub501@test.com", hash, "faculty", "CSE", "Faculty", 1]
    );

    await pool.query(
      `INSERT INTO users
       (user_id, name, email, password, role, department_code, designation, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["HOD501", "HOD User", "hod501@test.com", hash, "hod", "CSE", "Head of Department", 1]
    );

    await pool.query(
      `INSERT INTO users
       (user_id, name, email, password, role, department_code, designation, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["PRIN501", "Principal User", "prin501@test.com", hash, "principal", null, "Principal", 1]
    );

    /* =====================================================
       SEED LEAVE BALANCE (REQUIRED)
    ===================================================== */
    await pool.query(
      `INSERT INTO leave_balance
       (user_id, academic_year, casual_total, earned_total)
       VALUES (?, ?, ?, ?)`,
      ["FAC501", 2026, 10, 10]
    );

    /* =====================================================
       LOGIN AGENTS (SESSION-BASED)
    ===================================================== */
    facultyAgent = request.agent(app);
    substituteAgent = request.agent(app);
    hodAgent = request.agent(app);
    principalAgent = request.agent(app);

    await facultyAgent.post("/api/auth/login").send({
      user_id: "FAC501",
      password: "password",
    });

    await substituteAgent.post("/api/auth/login").send({
      user_id: "SUB501",
      password: "password",
    });

    await hodAgent.post("/api/auth/login").send({
      user_id: "HOD501",
      password: "password",
    });

    await principalAgent.post("/api/auth/login").send({
      user_id: "PRIN501",
      password: "password",
    });

    /* =====================================================
       APPLY LEAVE — WITH SUBSTITUTE
    ===================================================== */
    const applyWithSub = await facultyAgent.post("/api/apply").send({
      leave_type: "Earned Leave",
      start_date: "2026-03-05",
      start_session: "forenoon",   // keep exactly as your working test
      end_date: "2026-03-05",
      end_session: "afternoon",
      reason: "Medical",
      arr1_dept: "CSE",
      arr1_faculty: "SUB501",
      arr1_details: "AI lecture coverage",
    });

    expect(applyWithSub.statusCode).toBe(200);
    leaveIdWithSub = applyWithSub.body.leave_id;

    const [[arr]] = await pool.query(
      "SELECT arrangement_id FROM arrangements WHERE leave_id = ?",
      [leaveIdWithSub]
    );
    arrangementId = arr.arrangement_id;

    /* =====================================================
       APPLY LEAVE — WITHOUT SUBSTITUTE
    ===================================================== */
    const applyWithoutSub = await facultyAgent.post("/api/apply").send({
      leave_type: "Earned Leave",
      start_date: "2026-03-10",
      start_session: "Forenoon",
      end_date: "2026-03-10",
      end_session: "Afternoon",
      reason: "Personal",
    });

    expect(applyWithoutSub.statusCode).toBe(200);
    leaveIdWithoutSub = applyWithoutSub.body.leave_id;
  });

  afterAll(async () => {
    await pool.query("DELETE FROM arrangements");
    await pool.query("DELETE FROM leave_requests");
    await pool.query(
      "DELETE FROM users WHERE user_id IN ('FAC501','SUB501','HOD501','PRIN501')"
    );
    await pool.query("DELETE FROM leave_balance WHERE user_id = 'FAC501'");
    await pool.end();
  });

  /* =====================================================
     TEST 1: WITH SUBSTITUTE → Sub → HOD → Principal
  ===================================================== */
  test("Approve flow WITH substitute", async () => {
    const subRes = await substituteAgent.post(`/api/substitute/accept/${arrangementId}`);
    expect(subRes.statusCode).toBe(200);

    const hodRes = await hodAgent.post(`/api/hod/approve/${leaveIdWithSub}`);
    expect(hodRes.statusCode).toBe(200);

    const prinRes = await principalAgent.post(`/api/admin/approve/${leaveIdWithSub}`);
    expect(prinRes.statusCode).toBe(200);

    const [[row]] = await pool.query(
      "SELECT final_status FROM leave_requests WHERE leave_id = ?",
      [leaveIdWithSub]
    );

    expect(row.final_status).toBe("approved");
  });

  /* =====================================================
     TEST 2: WITHOUT SUBSTITUTE → HOD → Principal
  ===================================================== */
  test("Approve flow WITHOUT substitute", async () => {
    const hodRes = await hodAgent.post(`/api/hod/approve/${leaveIdWithoutSub}`);
    expect(hodRes.statusCode).toBe(200);

    const prinRes = await principalAgent.post(`/api/admin/approve/${leaveIdWithoutSub}`);
    expect(prinRes.statusCode).toBe(200);

    const [[row]] = await pool.query(
      "SELECT final_status FROM leave_requests WHERE leave_id = ?",
      [leaveIdWithoutSub]
    );

    expect(row.final_status).toBe("approved");
  });
});
