require("dotenv").config();
const pool = require("../config/db");
const { creditYearlyLeaves } = require("../services/leave/leaveCredit.service");

async function initLeaveBalances() {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const academicYear = new Date().getFullYear();

    // Fetch users who do NOT yet have leave balance for this year
    const [users] = await conn.query(`
      SELECT u.user_id, u.designation, u.date_joined
      FROM users u
      LEFT JOIN leave_balance lb
        ON lb.user_id = u.user_id
       AND lb.academic_year = ?
      WHERE lb.user_id IS NULL
    `, [academicYear]);

    console.log(`Found ${users.length} users needing leave credit`);

    for (const user of users) {
      await creditYearlyLeaves(conn, {
        user_id: user.user_id,
        designation: user.designation,
        date_joined: user.date_joined,
        academic_year: academicYear
      });

      console.log(`✅ Leave credited → ${user.user_id}`);
    }

    await conn.commit();
    console.log("🎉 Leave balance initialization complete");
  } catch (err) {
    await conn.rollback();
    console.error("❌ Leave balance init failed:", err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

initLeaveBalances();
