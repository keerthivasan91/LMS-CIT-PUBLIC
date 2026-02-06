/**
 * User Factory
 * Generates COMPLETE, valid users for Add User API
 * Session-based auth (NO JWT)
 */

let counter = 1;

/**
 * Base Add-User payload generator
 */
function buildUser(overrides = {}) {
  const id = overrides.user_id || `FAC${String(counter++).padStart(3, "0")}`;

  return {
    user_id: id,
    name: overrides.name || "Test User",
    email: overrides.email || `${id.toLowerCase()}@cit.edu.in`,
    password: overrides.password || "test_password", // plain (controller hashes)
    role: overrides.role || "faculty", // faculty | hod | principal | admin | staff

    department_code:
      overrides.department_code ??
      (overrides.role === "principal" || overrides.role === "admin"
        ? null
        : "CSE"),

    designation: overrides.designation || "Assistant Professor",
    phone: overrides.phone || "9876543210",
    date_joined: overrides.date_joined || "2023-06-01",

    is_active: overrides.is_active ?? 1,
  };
}

/* =====================================================
   Role-based helpers (FORM-ACCURATE)
===================================================== */

function buildFaculty(overrides = {}) {
  return buildUser({
    role: "faculty",
    designation: "Assistant Professor",
    ...overrides,
  });
}

function buildHOD(overrides = {}) {
  return buildUser({
    role: "hod",
    designation: "Professor & HOD",
    ...overrides,
  });
}

function buildPrincipal(overrides = {}) {
  return buildUser({
    role: "principal",
    department_code: null,
    designation: "Principal",
    ...overrides,
  });
}

function buildAdmin(overrides = {}) {
  return buildUser({
    role: "admin",
    department_code: null,
    designation: "System Administrator",
    ...overrides,
  });
}

function buildStaff(overrides = {}) {
  return buildUser({
    role: "staff",
    designation: "Office Staff",
    ...overrides,
  });
}

module.exports = {
  buildUser,
  buildFaculty,
  buildHOD,
  buildPrincipal,
  buildAdmin,
  buildStaff,
};
