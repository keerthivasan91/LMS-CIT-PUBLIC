/**
 * Unit Tests: Leave Calculation
 * Logic defined INSIDE test
 */

function calculateLeaveDays({
  start_date,
  start_session,
  end_date,
  end_session,
}) {
  const start = new Date(start_date);
  const end = new Date(end_date);

  if (end < start) throw new Error("Invalid date range");

  const diffDays =
    Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays === 1) {
    if (start_session === end_session) return 0.5;
    return 1;
  }

  return diffDays;
}

describe("Unit: Leave Calculation", () => {
  test("single full day leave", () => {
    expect(
      calculateLeaveDays({
        start_date: "2026-02-10",
        start_session: "Forenoon",
        end_date: "2026-02-10",
        end_session: "Afternoon",
      })
    ).toBe(1);
  });

  test("single half day leave", () => {
    expect(
      calculateLeaveDays({
        start_date: "2026-02-10",
        start_session: "Forenoon",
        end_date: "2026-02-10",
        end_session: "Forenoon",
      })
    ).toBe(0.5);
  });

  test("multi-day leave", () => {
    expect(
      calculateLeaveDays({
        start_date: "2026-02-10",
        start_session: "Forenoon",
        end_date: "2026-02-12",
        end_session: "Afternoon",
      })
    ).toBe(3);
  });

  test("invalid date range throws error", () => {
    expect(() =>
      calculateLeaveDays({
        start_date: "2026-02-12",
        start_session: "Forenoon",
        end_date: "2026-02-10",
        end_session: "Afternoon",
      })
    ).toThrow();
  });
});
