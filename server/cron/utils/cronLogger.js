const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../../logs");
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

const LOG_FILE = path.join(LOG_DIR, "cron.log");

function istTime() {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function log(level, job, message, meta = {}) {
  const entry = {
    time: istTime(),   // ✅ ALWAYS present
    level,
    job,
    message,
    ...meta,
  };

  const line = JSON.stringify(entry);

  console[level === "error" ? "error" : "log"](line);
  fs.appendFileSync(LOG_FILE, line + "\n");
}

module.exports = {
  info: (job, msg, meta) => log("info", job, msg, meta),
  warn: (job, msg, meta) => log("warn", job, msg, meta),
  error: (job, msg, meta) => log("error", job, msg, meta),
};
