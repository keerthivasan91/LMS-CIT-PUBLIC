/**
 * Leave Factory
 * Generates valid leave payloads for tests
 */

const { v4: uuidv4 } = require("uuid");

/**
 * Default valid leave payload
 */
function buildLeave(overrides = {}) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  return {
    leave_id: uuidv4(),                 // optional, DB may auto-generate
    user_id: overrides.user_id || 1,
    leave_type: overrides.leave_type || "CL", // CL, EL, RH
    start_date: overrides.start_date || today.toISOString().split("T")[0],
    end_date: overrides.end_date || tomorrow.toISOString().split("T")[0],
    reason: overrides.reason || "Personal work",
    is_half_day: overrides.is_half_day ?? false,
    session: overrides.session || null, // FN / AN if half-day
    status: overrides.status || "PENDING",
    applied_at: new Date(),
  };
}

/**
 * Approved leave
 */
function buildApprovedLeave(overrides = {}) {
  return buildLeave({
    status: "APPROVED",
    ...overrides,
  });
}

/**
 * Rejected leave
 */
function buildRejectedLeave(overrides = {}) {
  return buildLeave({
    status: "REJECTED",
    ...overrides,
  });
}

/**
 * Pending leave
 */
function buildPendingLeave(overrides = {}) {
  return buildLeave({
    status: "PENDING",
    ...overrides,
  });
}

module.exports = {
  buildLeave,
  buildApprovedLeave,
  buildRejectedLeave,
  buildPendingLeave,
};
