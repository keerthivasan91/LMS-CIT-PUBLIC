/**
 * Calculate number of leave days
 * Supports half-day & multi-day
 */

function calculateLeaveDays({
  start_date,
  start_session,
  end_date,
  end_session,
}) {
  const start = new Date(start_date);
  const end = new Date(end_date);

  if (end < start) {
    throw new Error("Invalid date range");
  }

  const dayDiff =
    Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

  // Same-day leave
  if (dayDiff === 1) {
    if (start_session === end_session) return 0.5;
    return 1;
  }

  return dayDiff;
}

module.exports = { calculateLeaveDays };
