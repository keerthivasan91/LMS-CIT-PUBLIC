// models/user.js

const pool = require("../config/db");

/* ============================================================
   GET USER (AUTH / SESSION)
============================================================ */
async function getUserById(user_id) {
  const [[row]] = await pool.query(
    `SELECT user_id, name, email, phone, role, department_code, password, designation, is_active
     FROM users
     WHERE user_id = ?
     LIMIT 1`,
    [user_id]
  );
  return row;
}

/* ============================================================
   GET USER BY EMAIL
============================================================ */
async function getUserByEmail(email) {
  const [[row]] = await pool.query(
    `SELECT user_id, name, email, phone, role, department_code, designation, is_active
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );
  return row;
}

/* ============================================================
   CREATE USER (NO LEAVE LOGIC HERE)
============================================================ */
async function createUser(conn, data) {
  const {
    user_id,
    name,
    email,
    phone,
    role,
    department_code,
    designation,
    date_joined,
    password
  } = data;

  await conn.query(
    `INSERT INTO users
     (user_id, name, email, phone, role, department_code,
      designation, date_joined, password, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      user_id,
      name,
      email,
      phone,
      role,
      department_code,
      designation,
      date_joined,
      password
    ]
  );

  return user_id;
}

/* ============================================================
   PASSWORD / PROFILE
============================================================ */
async function updatePassword(conn, user_id, hashedPassword) {
  await conn.query(
    `UPDATE users SET password = ? WHERE user_id = ?`,
    [hashedPassword, user_id]
  );
}

async function updateProfile(conn, user_id, { name, email, phone }) {
  await conn.query(
    `UPDATE users
     SET name = ?, email = ?, phone = ?
     WHERE user_id = ?`,
    [name, email, phone, user_id]
  );
}

/* ============================================================
   ROLE & POLICY HELPERS (IMPORTANT)
============================================================ */
async function getUserRole(conn, user_id) {
  const [[row]] = await conn.query(
    `SELECT role FROM users WHERE user_id = ? LIMIT 1`,
    [user_id]
  );
  return row?.role || null;
}

async function getUserDepartment(conn, user_id) {
  const [[row]] = await conn.query(
    `SELECT department_code FROM users WHERE user_id = ? LIMIT 1`,
    [user_id]
  );
  return row?.department_code || null;
}

/* ============================================================
   FACULTY / STAFF LOOKUPS
============================================================ */
async function getFacultyByDepartment(conn, department_code) {
  const [rows] = await conn.query(
    `SELECT user_id, name, email
     FROM users
     WHERE department_code = ?
       AND role IN ('faculty', 'hod')
       AND is_active = 1
     ORDER BY name`,
    [department_code]
  );
  return rows;
}

async function getStaffByDepartment(conn, department_code) {
  const [rows] = await conn.query(
    `SELECT user_id, name, email
     FROM users
     WHERE department_code = ?
       AND role IN ('staff', 'admin')
       AND is_active = 1
     ORDER BY name`,
    [department_code]
  );
  return rows;
}

/* ============================================================
   SUBSTITUTE LOOKUP
============================================================ */
async function getSubstitute(conn, user_id) {
  const [[row]] = await conn.query(
    `SELECT user_id, name, email, role, department_code
     FROM users
     WHERE user_id = ? AND is_active = 1
     LIMIT 1`,
    [user_id]
  );
  return row;
}

/* ============================================================
   ADMIN UTILITIES
============================================================ */
async function getAllDepartments(conn) {
  const [rows] = await conn.query(
    `SELECT DISTINCT department_code
     FROM users
     WHERE department_code IS NOT NULL
       AND is_active = 1
     ORDER BY department_code`
  );
  return rows.map(r => r.department_code);
}

async function userExists(conn, user_id) {
  const [[row]] = await conn.query(
    `SELECT 1 FROM users WHERE user_id = ? LIMIT 1`,
    [user_id]
  );
  return !!row;
}

async function emailExists(conn, email) {
  const [[row]] = await conn.query(
    `SELECT 1 FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  return !!row;
}

async function setActiveStatus(conn, user_id, isActive) {
  await conn.query(
    `UPDATE users SET is_active = ? WHERE user_id = ?`,
    [isActive, user_id]
  );
}

async function updateLastLogin( user_id) {
  await pool.query(
    `UPDATE users SET last_login = NOW() WHERE user_id = ?`,
    [user_id]
  );
}

/* ============================================================
   REACTIVATE USER
============================================================ */
async function reactivateUser(conn, user_id, data) {
  const {
    name,
    email,
    phone,
    role,
    department_code,
    designation,
    date_joined,
    password
  } = data;

  await conn.query(
    `UPDATE users
     SET name = ?, email = ?, phone = ?, role = ?, department_code = ?,
         designation = ?, date_joined = ?, password = ?, is_active = 1
     WHERE user_id = ?`,
    [
      name,
      email,
      phone,
      role,
      department_code,
      designation,
      date_joined,
      password,
      user_id
    ]
  );
}

async function getUserFull(conn,user_id) {
  const [[row]] = await conn.query(
    `SELECT * FROM users WHERE user_id = ? LIMIT 1`,
    [user_id]
  );
  return row;
}

/* ============================================================
   EXPORTS
============================================================ */
module.exports = {
  getUserById,
  getUserByEmail,
  createUser,
  updatePassword,
  updateProfile,

  getUserRole,
  getUserDepartment,

  getFacultyByDepartment,
  getStaffByDepartment,
  getSubstitute,

  getAllDepartments,
  userExists,
  emailExists,

  updateLastLogin,
  reactivateUser,
  getUserFull,
  setActiveStatus
};
