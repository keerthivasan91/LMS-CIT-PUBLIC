/**
 * HOD & Principal Pending Leave Reminder Templates
 */

const APP_URL = "https://d31bsugjsi7j8z.cloudfront.net/login";
const PRIMARY_COLOR = "#dc2626"; // red for attention

// Reusable Layout Helper (same style as user template)
const emailLayout = (content) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
    <div style="background-color: ${PRIMARY_COLOR}; padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 22px;">Pending Leave Reminder</h1>
    </div>
    <div style="padding: 40px; color: #334155; line-height: 1.6;">
      ${content}
    </div>
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
      © ${new Date().getFullYear()} Cambridge Institute Of Technology KR Puram. All rights reserved.
    </div>
  </div>
`;

/* =========================
   HOD REMINDER TEMPLATE
========================= */
function hodPendingReminder({ pendingCount }) {
  return emailLayout(`
    <h2 style="margin-top: 0; color: #1e293b;">Dear HOD,</h2>

    <p>
      You currently have <strong>${pendingCount}</strong> leave requests
      pending at the <strong>HOD approval level</strong>.
    </p>

    <p>
      Kindly review and take necessary action to avoid delays
      in the leave approval workflow.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}"
         style="background-color: ${PRIMARY_COLOR}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Review Pending Leaves
      </a>
    </div>

    <p style="font-size: 14px; color: #64748b;">
      This is an automated reminder from the Leave Management System.
    </p>
  `);
}

/* ============================
   PRINCIPAL REMINDER TEMPLATE
============================ */
function principalPendingReminder({ pendingCount }) {
  return emailLayout(`
    <h2 style="margin-top: 0; color: #1e293b;">Dear Principal,</h2>

    <p>
      There are currently <strong>${pendingCount}</strong> leave requests
      pending at the <strong>Principal approval level</strong>.
    </p>

    <p>
      Your timely approval is requested to ensure smooth academic
      and administrative operations.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}"
         style="background-color: ${PRIMARY_COLOR}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        View Pending Approvals
      </a>
    </div>

    <p style="font-size: 14px; color: #64748b;">
      This is an automated reminder from the Leave Management System.
    </p>
  `);
}

module.exports = {
  hodPendingReminder,
  principalPendingReminder,
};
