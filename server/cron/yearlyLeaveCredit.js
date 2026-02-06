const cron = require("node-cron");
const pool = require("../config/db");
const leaveCreditService = require("../services/leave/leaveCredit.service");

const DRY_RUN = process.env.CRON_DRY_RUN === "true";

/*
  YEARLY LEAVE CREDIT
  - Credits CL, RH, EL for all active users
  - Runs once every year on Jan 1st at 00:05 AM
*/

console.log(
  `✅ yearlyLeaveCredit.js loaded | DRY_RUN=${DRY_RUN}`
);

cron.schedule(
  "5 0 1 1 *", // Jan 1st, 12:05 AM
  async () => {
    const conn = await pool.getConnection();
    const academic_year = new Date().getFullYear();

    try {
      console.log(
        `[CRON] Yearly leave credit started for ${academic_year}`
      );

      // Fetch all active users
      const [users] = await conn.query(
        `SELECT user_id, designation, date_joined
         FROM users
         WHERE is_active = 1`
      );

      console.log(
        `[CRON] Active users found: ${users.length}`
      );

      if (DRY_RUN) {
        console.warn(
          `[CRON][DRY-RUN] Leave credit skipped for ${users.length} users`
        );

        for (const user of users) {
          console.warn(
            `[CRON][DRY-RUN] Would credit leaves → user_id=${user.user_id}, designation=${user.designation}`
          );
        }

        return; // 🚫 no DB writes
      }

      await conn.beginTransaction();

      for (const user of users) {
        await leaveCreditService.creditYearlyLeaves(conn, {
          user_id: user.user_id,
          designation: user.designation,
          date_joined: user.date_joined,
          academic_year,
        });
      }

      await conn.commit();
      console.log(
        `[CRON] Yearly leave credit completed for ${academic_year}`
      );

    } catch (err) {
      await conn.rollback();
      console.error(
        "[CRON] Yearly leave credit failed:",
        err
      );
    } finally {
      conn.release();
    }
  },
  {
    timezone: "Asia/Kolkata",
    scheduled: true,
  }
);

module.exports = {};
