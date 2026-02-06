// mailWorker.js
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const pool = require("../config/db");

/* =====================================================
   HARD DISABLE MAIL WORKER IN TEST ENV
===================================================== */
if (process.env.NODE_ENV === "test") {
  module.exports = async () => { };
  return;
}

/* =====================================================
   MAIL TRANSPORTER (SMTP)
===================================================== */
const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE || "gmail",
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: process.env.MAIL_SECURE === "true",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },

  // ✅ TIMEOUTS (CRITICAL)
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,

  pool: true,
  maxConnections: 3,
  maxMessages: 100,
});

/* =====================================================
   VERIFY TRANSPORTER (NON-BLOCKING)
===================================================== */
transporter.verify().then(
  () => console.log("📨 SMTP transporter ready"),
  (err) => console.error("❌ SMTP verify failed:", err.message)
);

/* =====================================================
   CONSTANTS
===================================================== */
const BATCH = 10;
const MAX_ATTEMPTS = 5;

/* =====================================================
   DB HELPERS
===================================================== */
async function claimBatch(conn, token) {
  const [res] = await conn.query(
    `
    UPDATE mail_queue
    SET processing_token = ?, processing_started_at = NOW()
    WHERE id IN (
      SELECT id FROM (
        SELECT id FROM mail_queue
        WHERE (
          status = 'pending'
          OR (
            status = 'failed'
            AND (next_retry_at IS NULL OR next_retry_at <= NOW())
          )
        )
        AND attempts < ?
        ORDER BY id
        LIMIT ?
      ) tmp
    )
    `,
    [token, MAX_ATTEMPTS, BATCH]
  );
  return res.affectedRows;
}

async function fetchClaimed(conn, token) {
  const [rows] = await conn.query(
    `SELECT * FROM mail_queue WHERE processing_token = ?`,
    [token]
  );
  return rows;
}

async function markSent(conn, id) {
  await conn.query(
    `
    UPDATE mail_queue
    SET status='sent',
        attempts = attempts + 1,
        processing_token = NULL,
        processing_started_at = NULL
    WHERE id = ?
    `,
    [id]
  );
}

async function markFailed(conn, id, errMsg, attempts) {
  const nextDelayMinutes = Math.min(1440, Math.pow(2, attempts));

  await conn.query(
    `
    UPDATE mail_queue
    SET status = CASE
          WHEN attempts + 1 >= ? THEN 'permanent_failed'
          ELSE 'failed'
        END,
        attempts = attempts + 1,
        last_error = ?,
        next_retry_at = CASE
          WHEN attempts + 1 >= ? THEN NULL
          ELSE DATE_ADD(NOW(), INTERVAL ? MINUTE)
        END,
        processing_token = NULL,
        processing_started_at = NULL
    WHERE id = ?
    `,
    [MAX_ATTEMPTS, errMsg, MAX_ATTEMPTS, nextDelayMinutes, id]
  );
}

/* =====================================================
   MAIN WORKER
===================================================== */
async function processMailQueue() {
  const token = uuidv4();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    await claimBatch(conn, token);
    await conn.commit();

    const mails = await fetchClaimed(conn, token);

    for (const mail of mails) {
      try {
        await transporter.sendMail({
          from: process.env.MAIL_FROM || process.env.MAIL_USER,
          to: mail.to_email,
          subject: mail.subject,
          html: mail.body,
        });

        await markSent(conn, mail.id);
      } catch (err) {
        const msg = err?.message?.slice(0, 1000) || String(err);
        await markFailed(conn, mail.id, msg, mail.attempts || 0);
      }
    }
  } catch (err) {
    await conn.rollback().catch(() => { });
    console.error("❌ Mail worker failed:", err);
  } finally {
    conn.release();
  }
}

module.exports = processMailQueue;
