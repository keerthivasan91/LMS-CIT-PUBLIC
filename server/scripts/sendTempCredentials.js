require("dotenv").config();
const pool = require("../config/db");
const  sendMail  = require("../services/mail.service");
const {userCreated} = require("../services/mailTemplates/user.templates");

async function sendBulkTempMails() {
  const conn = await pool.getConnection();

  try {
    const [users] = await conn.query(`
      SELECT user_id, name, email, password
      FROM users
      WHERE temp_mail_sent = 0
      LIMIT 10
    `);

    console.log(`Found ${users.length} users`);

    for (const user of users) {
      try {
        await sendMail({
          to: user.email,
          subject: "Your Temporary Login Credentials",
          html: userCreated({
            name: user.name,
            user_id: user.user_id,
            password : "password"
          })
        });

        await conn.query(
          `UPDATE users SET temp_mail_sent = 1 WHERE user_id = ?`,
          [user.user_id]
        );

        console.log(`✅ Sent → ${user.email}`);
      } catch (err) {
        console.error(`❌ Failed → ${user.email}`, err.message);
      }
    }
  } catch (err) {
    console.error("Bulk mail script failed:", err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

sendBulkTempMails();
