const sendMail = require("../config/mailer");

/**
 * Unified Mail API
 */
module.exports = async function sendMailService(to, subject, html) {
  if (!to) return;

  try {
    await sendMail(to, subject, html);
  } catch (err) {
    console.error("Mail error:", err.message);
  }
};
