const cron = require("node-cron");
const pool = require("../config/db");
const logger = require("./utils/cronLogger");

const JOB = "cleanupLeavesAndArrangements";
const DRY_RUN = process.env.CRON_DRY_RUN === "true";

/*
  CLEANUP JOB
  1. Delete PENDING & REJECTED leaves > 60 days
  2. Delete substitute arrangements > 90 days
*/

console.log(`✅ ${JOB}.js loaded | DRY_RUN=${DRY_RUN}`);

cron.schedule(
  "30 2 * * *", // Daily at 2:30 AM
  async () => {
    const conn = await pool.getConnection();
    logger.info(JOB, "Started");

    try {
      /* =========================
         LEAVE REQUEST CLEANUP
      ========================= */
      if (DRY_RUN) {
        const [[{ count }]] = await conn.query(`
          SELECT COUNT(*) AS count
          FROM leave_requests
          WHERE final_status IN ('pending', 'rejected')
            AND created_at < NOW() - INTERVAL 60 DAY
        `);

        logger.warn(JOB, "DRY-RUN leaves cleanup", {
          wouldDelete: count,
        });
      } else {
        const [leaveResult] = await conn.query(`
          DELETE FROM leave_requests
          WHERE final_status IN ('pending', 'rejected')
            AND created_at < NOW() - INTERVAL 60 DAY
        `);

        logger.info(JOB, "Leaves deleted", {
          affectedRows: leaveResult.affectedRows,
        });
      }

      /* =========================
         ARRANGEMENT CLEANUP
      ========================= */
      if (DRY_RUN) {
        const [[{ count }]] = await conn.query(`
          SELECT COUNT(*) AS count
          FROM arrangements
          WHERE created_at < NOW() - INTERVAL 90 DAY
        `);

        logger.warn(JOB, "DRY-RUN arrangements cleanup", {
          wouldDelete: count,
        });
      } else {
        const [arrangementResult] = await conn.query(`
          DELETE FROM arrangements
          WHERE created_at < NOW() - INTERVAL 90 DAY
        `);

        logger.info(JOB, "Arrangements deleted", {
          affectedRows: arrangementResult.affectedRows,
        });
      }

      logger.info(JOB, "Completed");

    } catch (err) {
      logger.error(JOB, "Failed", {
        error: err.message,
      });
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

// 👇 keep this ONLY for real cron execution
if (require.main === module) {
  cleanupRejectedLeaves().catch(console.error);
}