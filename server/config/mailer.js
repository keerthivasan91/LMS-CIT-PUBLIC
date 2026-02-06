// server/config/mailer.js

/* =====================================================
   TEST ENV — HARD NO-OP
===================================================== */
if (process.env.NODE_ENV === "test") {
  module.exports = async () => { };
} else {
  /* =====================================================
     REAL MAIL SETUP (DEV / PROD ONLY)
  ===================================================== */
  const logger = require("../services/logger");
  const queueEmail = require("../utils/mailQueue");

  async function sendMail({ to, subject, html }) {
    try {
      const queueId = await queueEmail(to, subject, html);

      logger.info(`Mail queued for: ${to} (queue_id=${queueId})`);
      console.log(`📥 Email queued → ${to} (queue_id=${queueId})`);

      return queueId;
    } catch (err) {
      console.error("❌ Failed to queue email:", err.message);
      logger.error(`Failed to queue email to ${to}: ${err.message}`);
      throw err;
    }
  }


  module.exports = sendMail;
}
