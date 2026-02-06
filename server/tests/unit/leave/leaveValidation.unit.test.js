/**
 * Unit Tests: Leave Validation
 * Logic defined INSIDE test
 */

const VALID_TYPES = ["Casual Leave", "Earned Leave", "OOD", "RH"];

function validateLeaveRequest(data) {
  const {
    leave_type,
    start_date,
    end_date,
    reason,
  } = data;

  if (!leave_type || !start_date || !end_date || !reason) {
    return false;
  }

  if (!VALID_TYPES.includes(leave_type)) return false;
  if (new Date(end_date) < new Date(start_date)) return false;

  return true;
}

describe("Unit: Leave Validation", () => {
  test("valid leave passes", () => {
    expect(
      validateLeaveRequest({
        leave_type: "Casual Leave",
        start_date: "2026-02-10",
        end_date: "2026-02-10",
        reason: "Personal",
      })
    ).toBe(true);
  });

  test("missing fields fail", () => {
    expect(
      validateLeaveRequest({
        leave_type: "Casual Leave",
        start_date: "2026-02-10",
      })
    ).toBe(false);
  });

  test("invalid leave type fails", () => {
    expect(
      validateLeaveRequest({
        leave_type: "Vacation",
        start_date: "2026-02-10",
        end_date: "2026-02-10",
        reason: "Test",
      })
    ).toBe(false);
  });

  test("invalid date range fails", () => {
    expect(
      validateLeaveRequest({
        leave_type: "Casual Leave",
        start_date: "2026-02-12",
        end_date: "2026-02-10",
        reason: "Test",
      })
    ).toBe(false);
  });
});
