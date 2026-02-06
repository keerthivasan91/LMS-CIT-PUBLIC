/**
 * Unit Tests: Leave Escalation
 * Logic defined INSIDE test
 */

function shouldEscalateLeave({
  hod_status,
  applied_on,
  today,
  thresholdDays,
}) {
  if (hod_status !== "pending") return false;

  const applied = new Date(applied_on);
  const now = new Date(today);

  const diff =
    Math.floor((now - applied) / (1000 * 60 * 60 * 24));

  return diff > thresholdDays;
}

describe("Unit: Leave Escalation", () => {
  test("escalates after threshold", () => {
    expect(
      shouldEscalateLeave({
        hod_status: "pending",
        applied_on: "2026-01-01",
        today: "2026-01-10",
        thresholdDays: 7,
      })
    ).toBe(true);
  });

  test("does not escalate within threshold", () => {
    expect(
      shouldEscalateLeave({
        hod_status: "pending",
        applied_on: "2026-01-05",
        today: "2026-01-10",
        thresholdDays: 7,
      })
    ).toBe(false);
  });

  test("does not escalate if not pending", () => {
    expect(
      shouldEscalateLeave({
        hod_status: "approved",
        applied_on: "2026-01-01",
        today: "2026-01-10",
        thresholdDays: 7,
      })
    ).toBe(false);
  });
});
