const cron = require("node-cron");
const pool = require("../config/db");

const DRY_RUN = process.env.CRON_DRY_RUN === "true";

/*
  YEARLY LEAVE COLLAPSE
  - CL → reset
  - RH → reset
  - EL → carry forward
  Runs once every year on Jan 1st at 12:10 AM
*/

console.log(
  `✅ yearlyLeaveCollapse.js loaded | DRY_RUN=${DRY_RUN}`
);

cron.schedule(
  "10 0 1 1 *", // Jan 1st, 12:10 AM
  async () => {
    const conn = await pool.getConnection();
    const year = new Date().getFullYear();

    try {
      console.log(
        `[CRON] Yearly leave collapse started for ${year}`
      );

      if (DRY_RUN) {
        const [[{ affected }]] = await conn.query(
          `SELECT COUNT(*) AS affected
           FROM leave_balance
           WHERE academic_year < ?`,
          [year]
        );

        console.warn(
          `[CRON][DRY-RUN] Leave collapse skipped | Rows affected: ${affected}`
        );

        return; // 🚫 no DB writes
      }

      await conn.beginTransaction();

      await conn.query(
        `UPDATE leave_balance
         SET
           casual_total = 0,
           casual_used = 0,
           rh_total = 0,
           rh_used = 0
         WHERE academic_year < ?`,
        [year]
      );

      await conn.commit();
      console.log(
        `[CRON] Yearly leave collapse completed for ${year}`
      );

    } catch (err) {
      await conn.rollback();
      console.error(
        "[CRON] Yearly leave collapse failed:",
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
