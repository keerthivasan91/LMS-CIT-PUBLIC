/**
 * Unit Tests: leaveBalance.service.js
 * - DB mocked
 * - No real MySQL
 * - CI/CD safe
 */

jest.mock("../../../config/db", () => ({
  query: jest.fn(),
}));

jest.mock("../../../policies/leave.policy", () => ({
  getPolicy: jest.fn(),
}));

const pool = require("../../../config/db");
const leavePolicy = require("../../../policies/leave.policy");

const {
  getBalance,
  ensureBalanceRow,
  deduct,
} = require("../../../services/leave/leaveBalance.service");

describe("Unit: Leave Balance Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  /* ===================== getBalance ===================== */

  test("getBalance returns row if exists", async () => {
    pool.query.mockResolvedValueOnce([[{ casual_total: 10 }]]);

    const result = await getBalance("FAC001", "2025-26");

    expect(pool.query).toHaveBeenCalled();
    expect(result.casual_total).toBe(10);
  });

  test("getBalance returns null if no row", async () => {
    pool.query.mockResolvedValueOnce([[undefined]]);

    const result = await getBalance("FAC001", "2025-26");

    expect(result).toBeNull();
  });

  /* ================= ensureBalanceRow =================== */

  test("ensureBalanceRow inserts using policy values", async () => {
    const conn = { query: jest.fn() };

    leavePolicy.getPolicy.mockReturnValue({
      casual: 12,
      earned: 15,
      rh: 2,
    });

    await ensureBalanceRow({
      conn,
      user_id: "FAC001",
      designation: "faculty",
      academic_year: "2025-26",
    });

    expect(leavePolicy.getPolicy).toHaveBeenCalledWith("faculty");
    expect(conn.query).toHaveBeenCalled();
  });

  /* ====================== deduct ======================== */

  test("deduct updates leave when sufficient balance exists", async () => {
    const conn = {
      query: jest.fn().mockResolvedValueOnce([{ affectedRows: 1 }]),
    };

    await deduct({
      conn,
      user_id: "FAC001",
      leave_type: "Casual Leave",
      days: 2,
      academic_year: "2025-26",
    });

    expect(conn.query).toHaveBeenCalled();
  });

  test("deduct throws error when balance insufficient", async () => {
    const conn = {
      query: jest.fn().mockResolvedValueOnce([{ affectedRows: 0 }]),
    };

    await expect(
      deduct({
        conn,
        user_id: "FAC001",
        leave_type: "Casual Leave",
        days: 5,
        academic_year: "2025-26",
      })
    ).rejects.toThrow("Leave balance insufficient");
  });

  test("deduct silently skips unknown leave type", async () => {
    const conn = { query: jest.fn() };

    await deduct({
      conn,
      user_id: "FAC001",
      leave_type: "INVALID",
      days: 2,
      academic_year: "2025-26",
    });

    expect(conn.query).not.toHaveBeenCalled();
  });

  test("deduct skips zero or negative days", async () => {
    const conn = { query: jest.fn() };

    await deduct({
      conn,
      user_id: "FAC001",
      leave_type: "Casual Leave",
      days: 0,
      academic_year: "2025-26",
    });

    expect(conn.query).not.toHaveBeenCalled();
  });
});
