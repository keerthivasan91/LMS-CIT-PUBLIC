const cron = require("node-cron");
const axios = require("axios");
const logger = require("./utils/cronLogger");
const { sendMail } = require("../services/mail.service");

const JOB = "healthApiCheck";
const DRY_RUN = process.env.CRON_DRY_RUN === "true";
const HEALTH_URL = process.env.HEALTH_URL || "http://localhost:8080/health";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

/*
  HEALTH API CHECK
  - Pings /health endpoint
  - Logs status
  - Alerts admin on failure (PROD only)
*/

console.log(`✅ ${JOB}.js loaded | DRY_RUN=${DRY_RUN}`);

cron.schedule(
  "*/5 * * * *", // Every 5 minutes
  async () => {
    const start = Date.now();
    logger.info(JOB, "Started");

    try {
      if (DRY_RUN) {
        logger.warn(JOB, "DRY-RUN enabled, API ping skipped", {
          url: HEALTH_URL,
        });
        return;
      }

      const res = await axios.get(HEALTH_URL, { timeout: 5000 });
      const data = res.data;
      const duration = Date.now() - start;

      if (
        data.status === "healthy" &&
        data.database === "connected"
      ) {
        logger.info(JOB, "Health OK", {
          uptime: data.uptime,
          responseTimeMs: duration,
        });
      } else {
        logger.warn(JOB, "Health DEGRADED", { response: data });

        // 📧 Notify admin
        await sendMail({
          to: ADMIN_EMAIL,
          subject: "🚨 LMS Health Degraded",
          html: `
            <h3>LMS Health Warning</h3>
            <p>The health check returned a degraded status.</p>
            <pre>${JSON.stringify(data, null, 2)}</pre>
            <p>Checked at: ${new Date().toISOString()}</p>
          `,
        });
      }

    } catch (err) {
      logger.error(JOB, "Health DOWN", {
        error: err.message,
        url: HEALTH_URL,
      });

      // 📧 Notify admin (API unreachable)
      if (!DRY_RUN) {
        await sendMail({
          to: ADMIN_EMAIL,
          subject: "🔥 LMS Health Check FAILED",
          html: `
            <h3>LMS Health Check Failed</h3>
            <p>The health API is not reachable.</p>
            <p><strong>Error:</strong> ${err.message}</p>
            <p><strong>URL:</strong> ${HEALTH_URL}</p>
            <p>Time: ${new Date().toISOString()}</p>
          `,
        });
      }
    }
  },
  {
    timezone: "Asia/Kolkata",
    scheduled: true,
  }
);

module.exports = {};
