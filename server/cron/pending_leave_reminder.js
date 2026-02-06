const cron = require("node-cron");
const pool = require("../config/db");
const { sendMail } = require("../services/mail.service");

const {
  hodPendingReminder,
  principalPendingReminder,
} = require("../services/mailTemplates/authorityReminder.templates");

const DRY_RUN = process.env.CRON_DRY_RUN === "true";

/*
  PENDING LEAVE ESCALATION
  - If HOD pending > 5 → mail HOD
  - If Principal pending > 10 → mail Principal
  Runs daily
*/

console.log(
  `✅ pendingLeaveEscalation.js loaded | DRY_RUN=${DRY_RUN}`
);

cron.schedule(
  "0 9 * * *", // Every day at 9:00 AM
  async () => {
    const conn = await pool.getConnection();

    try {
      console.log("[CRON] Pending leave escalation check started");

      /* =====================
         HOD PENDING CHECK
      ===================== */
      const [[{ hodCount }]] = await conn.query(`
        SELECT COUNT(*) AS hodCount
        FROM leave_requests
        WHERE hod_status = 'pending'
          AND final_status = 'pending'
      `);

      if (hodCount > 5) {
        const [hods] = await conn.query(`
          SELECT email
          FROM users
          WHERE role = 'HOD'
        `);

        if (hods.length) {
          if (DRY_RUN) {
            console.warn(
              `[CRON][DRY-RUN] HOD mail skipped | Pending: ${hodCount} | Recipients: ${hods.length}`
            );
          } else {
            await sendMail({
              to: hods.map(h => h.email),
              subject: "Pending Leave Approvals – HOD Action Required",
              html: hodPendingReminder({ pendingCount: hodCount }),
            });

            console.log(
              `[CRON] HOD reminder sent | Pending: ${hodCount}`
            );
          }
        }
      }

      /* =========================
         PRINCIPAL PENDING CHECK
      ========================= */
      const [[{ principalCount }]] = await conn.query(`
        SELECT COUNT(*) AS principalCount
        FROM leave_requests
        WHERE hod_status = 'approved'
          AND principal_status = 'pending'
          AND final_status = 'pending'
      `);

      if (principalCount > 10) {
        const [principals] = await conn.query(`
          SELECT email
          FROM users
          WHERE role = 'PRINCIPAL'
        `);

        if (principals.length) {
          if (DRY_RUN) {
            console.warn(
              `[CRON][DRY-RUN] Principal mail skipped | Pending: ${principalCount} | Recipients: ${principals.length}`
            );
          } else {
            await sendMail({
              to: principals.map(p => p.email),
              subject:
                "Pending Leave Approvals – Principal Action Required",
              html: principalPendingReminder({
                pendingCount: principalCount,
              }),
            });

            console.log(
              `[CRON] Principal reminder sent | Pending: ${principalCount}`
            );
          }
        }
      }

      console.log("[CRON] Pending leave escalation check completed");

    } catch (err) {
      console.error(
        "[CRON] Pending leave escalation failed:",
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
