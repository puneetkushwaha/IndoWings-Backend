import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const RESEND_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@dev2dev.online';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

const resend = new Resend(RESEND_KEY);

const smtpTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Generic email sender with auto-fallback
export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html?: string }) {
  if (!to || !to.includes('@')) {
    console.log(`[mail] Skipped invalid destination: Invalid destination: ${to}`);
    return;
  }

  // 1. Try Resend
  try {
    const { data, error } = await resend.emails.send({
      from: `IndoWings Flight Operations <${FROM_EMAIL}>`,
      to: [to],
      subject,
      text,
      html: html || undefined,
    });

    if (data && !error) {
      console.log(`[mail] Sent via Resend: To: ${to} | Subject: "${subject}" (ID: ${data.id})`);
      return;
    }
    if (error) {
      console.warn(`[mail] Resend notice: ${error.message}. Trying SMTP fallback...`);
    }
  } catch (err: any) {
    console.warn(`[mail] Resend error: ${err.message}. Trying SMTP fallback...`);
  }

  // 2. Fallback to Gmail SMTP
  try {
    const info = await smtpTransporter.sendMail({
      from: `"IndoWings Aerial Logistics" <${SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || undefined,
    });
    console.log(`[mail] Sent via SMTP: To: ${to} | Subject: "${subject}" (MessageID: ${info.messageId})`);
  } catch (smtpErr: any) {
    console.error(`[mail] Failed to send: Could not send email via Resend or SMTP:`, smtpErr.message);
  }
}

// ── 0. OTP Dispatch (Email & SMS Gateway) ───────────────────────────────────
export async function sendOtpNotification({ email, phone, otp }: { email?: string; phone?: string; otp: string }) {
  // 1. Send direct plain-text Email OTP
  if (email && email.includes('@')) {
    const isEmailLogin = !phone;
    const subject = isEmailLogin
      ? `Your IndoWings Login Verification Code: ${otp}`
      : `Your IndoWings Verification Code: ${otp}`;
    const text = isEmailLogin
      ? `
Hello,

Your 6-digit IndoWings login verification code for ${email} is:

------------------------------------
               ${otp}
------------------------------------

Valid for 10 minutes. Please enter this code in the login portal to access your account.

If you did not request this code, please ignore this email.

IndoWings Flight Operations
Sector 62, Noida, Uttar Pradesh
`.trim()
      : `
Hello,

Your 6-digit IndoWings verification code for +91 ${phone} is:

------------------------------------
               ${otp}
------------------------------------

Valid for 10 minutes. Please enter this code in the login portal to verify your account.

If you did not request this code, please ignore this email.

IndoWings Flight Operations
Sector 62, Noida, Uttar Pradesh
`.trim();

    sendEmail({ to: email, subject, text }).catch(err => console.error('OTP email error:', err));
  }

  // 2. Dispatch to SMS Gateway (Fast2SMS / Webhook)
  if (phone) {
    try {
      const fast2smsKey = process.env.FAST2SMS_API_KEY;
      if (fast2smsKey && fast2smsKey !== 'xxx') {
        const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${fast2smsKey}&variables_values=${otp}&route=otp&numbers=${phone}`;
        await fetch(url);
        console.log(`📱 [Fast2SMS Gateway] SMS OTP ${otp} dispatched to +91 ${phone}`);
      }
    } catch (err: any) {
      console.warn(` [SMS Gateway Warning]: ${err.message}`);
    }
  }
}

// ── 1. Welcome / Signup Email ────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string, phone?: string) {
  const subject = `Welcome to IndoWings Drone Delivery - Account Activated`;
  const text = `
Hello ${name},

Welcome to IndoWings Autonomous Drone Delivery Network!

Your customer account has been successfully created and verified via Mobile OTP.

Account Details:
- Name: ${name}
- Email: ${to}
- Registered Mobile: ${phone || 'N/A'}
- Platform: IndoWings Aerial Logistics (DGCA Certified)

You can now dispatch aerial courier deliveries across Delhi NCR in under 30 minutes.
Place your orders here: http://localhost:3000/order

Best regards,
IndoWings Flight Operations Team
Sector 62, Noida, Uttar Pradesh
Helpline: 1800 572 7363
`.trim();

  await sendEmail({ to, subject, text });
}

// ── 2. Login Security Alert Email ───────────────────────────────────────────
export async function sendLoginAlertEmail(to: string, name: string, role: string, ip?: string) {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const subject = `Security Alert: Login Detected for ${name} (${role.toUpperCase()})`;
  const text = `
Hello ${name},

A new login to your IndoWings account was detected.

Login Information:
- Account: ${to}
- Role: ${role.toUpperCase()}
- Date & Time: ${timestamp} IST
- Access Gateway: IndoWings Command Center & Delivery Portal
- Client IP: ${ip || '127.0.0.1 (Local)'}

If this was you, no action is needed. If you did not authorize this session, please contact IndoWings security immediately.

Regards,
IndoWings Cyber Security & Flight Command
`.trim();

  await sendEmail({ to, subject, text });
}

// ── 3. Order Placed Confirmation Email ──────────────────────────────────────
export async function sendOrderPlacedEmail(order: any) {
  const to = order.customer_email;
  if (!to) return;

  const subject = `Order Confirmed: Drone Delivery ${order.id} Assigned`;
  const text = `
Hello ${order.customer_name},

Your IndoWings drone delivery request has been confirmed and placed into active dispatch queue.

ORDER DETAILS:
--------------------------------------------------
Order ID:            ${order.id}
Package Type:        ${order.package_type}
Weight:              ${order.weight_kg} kg
Total Fare:          Rs. ${order.fare_inr || 149}
Payment Method:      ${(order.payment_method || 'online').toUpperCase()}
Payment Status:      ${(order.payment_status || 'paid').toUpperCase()}
Assigned UAV:        ${order.drone_id || 'Auto-assigning'} (${order.drone_model || 'Cyberone Max'})
Est. Aerial Distance:${order.aerial_distance_km ? order.aerial_distance_km + ' km' : '~14.8 km'}
Est. Flight Time:    ${order.flight_duration_mins ? order.flight_duration_mins + ' mins' : '~18 mins'}

TRANSIT ROUTE:
--------------------------------------------------
Pickup Point:        ${order.pickup_address}
Drop Destination:    ${order.drop_address}

You can track your live drone flight and telemetry here:
http://localhost:3000/track?id=${order.id}

Thank you for choosing IndoWings Aerial Logistics.

Flight Operations Desk
IndoWings Pvt Ltd
`.trim();

  await sendEmail({ to, subject, text });
}

// ── 4. Order Status Update Email (Dispatch, Hold, Delivered, Failed) ─────────
export async function sendOrderStatusEmail(order: any, newStatus: string) {
  const to = order.customer_email;
  if (!to) return;

  const statusLabels: Record<string, string> = {
    'on-hold': 'ON HOLD ⏸️',
    'in-flight': 'DISPATCHED & IN-FLIGHT ✈️',
    'delivered': 'DELIVERED SUCCESSFULLY ✅',
    'failed': 'DELIVERY FAILED / RETURNED ',
    'rescheduled': 'RESCHEDULED 🔄',
    'approaching': 'APPROACHING DROP ZONE 📍',
    'taking-off': 'UAV TAKING OFF 🛫',
    'cancelled': 'ORDER CANCELLED '
  };

  const currentLabel = statusLabels[newStatus] || newStatus.toUpperCase();
  const subject = `Flight Update: Order ${order.id} is now ${currentLabel}`;

  const text = `
Hello ${order.customer_name},

There is a real-time status update for your drone delivery order ${order.id}.

Current Flight Status: ${currentLabel}
Timestamp:            ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST

ORDER SUMMARY:
--------------------------------------------------
Order ID:            ${order.id}
Assigned UAV:        ${order.drone_id || 'Cyberone UAV'}
Package:             ${order.package_type} (${order.weight_kg} kg)
Pickup:              ${order.pickup_address}
Drop:                ${order.drop_address}
Payment Status:      ${(order.payment_status || 'PAID').toUpperCase()}

Track live drone coordinates and telemetry:
http://localhost:3000/track?id=${order.id}

For flight support or corridor queries, contact IndoWings Air Traffic Desk.

IndoWings Flight Operations
`.trim();

  await sendEmail({ to, subject, text });
}

// ── 5. Expert Consultation Request Confirmation Email ────────────────────────
export async function sendExpertRequestCreatedEmail(request: any) {
  const to = request.email;
  if (!to || !to.includes('@')) return;

  const subject = `Consultation Request Confirmed [${request.id}] - IndoWings Flight Operations`;
  const text = `
Hello ${request.name || 'Valued Customer'},

Thank you for contacting the IndoWings Flight Operations & Aerial Delivery Desk.

Your consultation callback request has been recorded and scheduled in our active engineering queue.

CONSULTATION DETAILS:
--------------------------------------------------
Reference ID:       ${request.id}
Topic / Category:   ${request.category}
Preferred Slot:     ${request.preferred_time}
Contact Phone:      ${request.phone || 'N/A'}
Contact Email:      ${request.email}
Current Status:     PENDING CALLBACK
Logged At:          ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST

YOUR INQUIRY NOTES:
"${request.message || 'No additional notes provided.'}"

NEXT STEPS:
1. Our flight operations engineer will review your terrace / drop coordinates and mission feasibility.
2. We will reach out to you at ${request.phone || 'your registered number'} during your requested slot (${request.preferred_time}).
3. For immediate assistance, feel free to WhatsApp us directly: https://wa.me/919999999999

Best regards,
IndoWings Flight Command Desk
Sector 62, Noida, Uttar Pradesh
Helpline: 1800-IND-WINGS
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f4fb; margin: 0; padding: 30px 20px; color: #171222;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(59, 0, 128, 0.06);">
    <div style="background: linear-gradient(135deg, #1e0940 0%, #3b0080 100%); padding: 28px; text-align: center; color: white;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">IndoWings Aerial Logistics</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #e9d5ff;">Flight Operations & Technical Consultation Desk</p>
    </div>
    
    <div style="padding: 28px;">
      <div style="background: #fdf2f8; border-left: 4px solid #3b0080; padding: 12px 16px; border-radius: 6px; margin-bottom: 22px;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #3b0080; letter-spacing: 1px;">Request Logged</span>
        <h2 style="margin: 4px 0 0 0; font-size: 17px; color: #171222;">Consultation Callback Scheduled</h2>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Hello <strong>${request.name || 'Valued Customer'}</strong>,<br>
        Your consultation request has been received. Our flight operations team will review your terrace and mission parameters and call you during your requested slot.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Reference Ticket</td>
          <td style="padding: 10px 0; font-weight: 700; color: #3b0080; font-family: monospace; font-size: 15px;">${request.id}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Inquiry Category</td>
          <td style="padding: 10px 0; font-weight: 600; color: #1e293b;">${request.category}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Preferred Slot</td>
          <td style="padding: 10px 0; font-weight: 600; color: #1e293b;">${request.preferred_time}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Contact Phone</td>
          <td style="padding: 10px 0; font-weight: 600; color: #1e293b;">${request.phone || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Current Status</td>
          <td style="padding: 10px 0;"><span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 11px; text-transform: uppercase;">Pending Callback</span></td>
        </tr>
      </table>

      ${request.message ? `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 22px;">
        <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">Your Inquiry Notes</span>
        <p style="margin: 0; font-size: 13px; color: #334155; font-style: italic;">"${request.message}"</p>
      </div>` : ''}

      <div style="text-align: center; margin: 25px 0;">
        <a href="https://wa.me/919999999999?text=${encodeURIComponent(`Hello IndoWings, I have a callback booked with reference ID ${request.id}`)}" style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 13px; margin-right: 8px;">
          💬 Chat on WhatsApp
        </a>
        <a href="http://localhost:3000/support" style="display: inline-block; background: #3b0080; color: white; padding: 12px 24px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 13px;">
          📘 View Knowledge Center
        </a>
      </div>
    </div>

    <div style="background: #f8fafc; padding: 18px 28px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
      &copy; 2026 IndoWings Technologies. DGCA & Aerospace Compliance.<br>
      Sector 62, Noida, Uttar Pradesh · Helpline: 1800-IND-WINGS
    </div>
  </div>
</body>
</html>
`.trim();

  await sendEmail({ to, subject, text, html });
}

// ── 6. Expert Consultation Status Update Email ───────────────────────────────
export async function sendExpertRequestStatusEmail(request: any, newStatus: string, adminNotes?: string) {
  const to = request.email;
  if (!to || !to.includes('@')) return;

  const statusDescriptions: Record<string, { label: string; bg: string; textCol: string; message: string }> = {
    'pending': {
      label: 'PENDING CALLBACK',
      bg: '#fef3c7',
      textCol: '#92400e',
      message: 'Your callback request is in the operations queue and will be picked up shortly.'
    },
    'in-progress': {
      label: 'IN PROGRESS / REVIEWING',
      bg: '#e0e7ff',
      textCol: '#3730a3',
      message: 'A dedicated Flight Operations engineer has picked up your inquiry and is reviewing terrace satellite imagery and mission corridors.'
    },
    'contacted': {
      label: 'CONTACT INITIATED',
      bg: '#e0f2fe',
      textCol: '#0369a1',
      message: 'Our flight engineer has reached out to you via phone/WhatsApp regarding your consultation request.'
    },
    'resolved': {
      label: 'RESOLVED & COMPLETED',
      bg: '#dcfce7',
      textCol: '#166534',
      message: 'Your consultation session has been successfully completed. Your query has been resolved by our engineering team.'
    }
  };

  const statusInfo = statusDescriptions[newStatus] || {
    label: newStatus.toUpperCase(),
    bg: '#f1f5f9',
    textCol: '#334155',
    message: `Your consultation request status has been updated to ${newStatus}.`
  };

  const subject = `Consultation Update [${request.id}]: ${statusInfo.label}`;
  const text = `
Hello ${request.name || 'Valued Customer'},

Your IndoWings consultation request status has been updated.

STATUS UPDATE:
--------------------------------------------------
Reference ID:       ${request.id}
Topic:              ${request.category}
Updated Status:     ${statusInfo.label}
Details:            ${statusInfo.message}
Timestamp:          ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
${adminNotes ? `Operations Note:   "${adminNotes}"` : ''}

Original Request:
- Preferred Time:   ${request.preferred_time}
- Notes:            "${request.message || 'N/A'}"

If you have further questions or want to place your drone delivery order now, please visit:
http://localhost:3000/order

Best regards,
IndoWings Flight Operations Desk
Sector 62, Noida, Uttar Pradesh
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f4fb; margin: 0; padding: 30px 20px; color: #171222;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(59, 0, 128, 0.06);">
    <div style="background: linear-gradient(135deg, #1e0940 0%, #3b0080 100%); padding: 28px; text-align: center; color: white;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">IndoWings Aerial Logistics</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #e9d5ff;">Flight Operations & Technical Consultation Desk</p>
    </div>
    
    <div style="padding: 28px;">
      <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 1px; display: block; margin-bottom: 6px;">Lifecycle Status</span>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h2 style="margin: 0; font-size: 18px; color: #171222;">Ticket ${request.id}</h2>
          <span style="background: ${statusInfo.bg}; color: ${statusInfo.textCol}; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 12px; text-transform: uppercase;">
            ${statusInfo.label}
          </span>
        </div>
      </div>

      <div style="background: #faf5ff; border-left: 4px solid #3b0080; padding: 14px 18px; border-radius: 8px; margin-bottom: 22px;">
        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #334155; font-weight: 500;">
          ${statusInfo.message}
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Hello <strong>${request.name || 'Valued Customer'}</strong>,<br>
        Our flight dispatch command has updated the status of your consultation inquiry regarding <strong>${request.category}</strong>.
      </p>

      ${adminNotes ? `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px; margin: 18px 0;">
        <span style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; display: block; margin-bottom: 4px;">Flight Operations Note</span>
        <p style="margin: 0; font-size: 13px; color: #14532d;">${adminNotes}</p>
      </div>` : ''}

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Reference Ticket</td>
          <td style="padding: 10px 0; font-weight: 700; color: #3b0080; font-family: monospace;">${request.id}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Topic</td>
          <td style="padding: 10px 0; font-weight: 600; color: #1e293b;">${request.category}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Requested Slot</td>
          <td style="padding: 10px 0; font-weight: 600; color: #1e293b;">${request.preferred_time}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Updated At</td>
          <td style="padding: 10px 0; color: #1e293b;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td>
        </tr>
      </table>

      <div style="text-align: center; margin: 25px 0;">
        <a href="http://localhost:3000/order" style="display: inline-block; background: #3b0080; color: white; padding: 12px 24px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 13px; margin-right: 8px;">
          🚀 Dispatch Drone Delivery
        </a>
        <a href="http://localhost:3000/support" style="display: inline-block; background: #f1f5f9; color: #334155; padding: 12px 24px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 13px;">
          📘 Knowledge Center
        </a>
      </div>
    </div>

    <div style="background: #f8fafc; padding: 18px 28px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
      &copy; 2026 IndoWings Technologies. DGCA & Aerospace Compliance.<br>
      Sector 62, Noida, Uttar Pradesh · Helpline: 1800-IND-WINGS
    </div>
  </div>
</body>
</html>
`.trim();

  await sendEmail({ to, subject, text, html });
}

// ── 7. Order Completion: Feedback Invitation Email ──────────────────────────
export async function sendFeedbackInvitationEmail(order: any) {
  const to = order.customer_email;
  if (!to || !to.includes('@')) return;

  const droneModel = order.drone_model || order.drone_id || 'Cyberone UAV Platform';
  const subject = `Flight Delivered: Rate Your Drone Cargo Experience [Order ${order.id}] - IndoWings`;
  const feedbackUrl = `http://localhost:3000/feedback?orderId=${order.id}&drone=${encodeURIComponent(droneModel)}&name=${encodeURIComponent(order.customer_name || '')}&email=${encodeURIComponent(to)}`;

  const text = `
Hello ${order.customer_name || 'Valued Customer'},

Your IndoWings drone flight for Order ${order.id} has touched down and completed successfully!

FLIGHT SUMMARY:
--------------------------------------------------
Order ID:       ${order.id}
Autonomous UAV: ${droneModel}
Pickup:         ${order.pickup_address}
Drop:           ${order.drop_address}
Touchdown Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST

We value your feedback to continually enhance autonomous flight corridors, delivery speed, and safety.
Please take 30 seconds to rate your delivery and tell us about your experience:

${feedbackUrl}

Thank you for choosing IndoWings Aerial Logistics.

IndoWings Flight Operations & Customer Experience
Sector 62, Noida, Uttar Pradesh
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Rate Your Delivery</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f4fb; margin: 0; padding: 30px 15px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    
    <!-- Top Header -->
    <div style="background: #1b0038; padding: 28px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">IndoWings Aerial Logistics</h1>
      <p style="color: #d8b4fe; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">DGCA Type-Certified Autonomous Cargo Network</p>
    </div>
    
    <!-- Body Content -->
    <div style="padding: 28px 24px;">
      
      <!-- Completed Badge -->
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 22px; text-align: center;">
        <span style="display: inline-block; background: #16a34a; color: white; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          ✓ Delivery Complete
        </span>
        <h2 style="margin: 4px 0 0 0; font-size: 19px; color: #14532d; font-weight: 800;">
          Order ${order.id} Touched Down
        </h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #166534;">
          Your payload was delivered safely by <strong>${droneModel}</strong>.
        </p>
      </div>

      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
        Hello <strong>${order.customer_name || 'Valued Customer'}</strong>,<br>
        How was your autonomous drone delivery experience? Your feedback helps us optimize precision winch landings, corridor speeds, and overall mission execution.
      </p>

      <!-- Rating Prompt Box -->
      <div style="background: #faf5ff; border: 2px dashed #c084fc; border-radius: 14px; padding: 22px; text-align: center; margin: 24px 0;">
        <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #7e22ce; letter-spacing: 1px; display: block; margin-bottom: 8px;">Quick Flight Rating</span>
        <div style="font-size: 28px; margin-bottom: 14px; letter-spacing: 4px;">
          ⭐⭐⭐⭐⭐
        </div>
        <a href="${feedbackUrl}" style="display: inline-block; background: #3b0080; color: #ffffff; padding: 14px 32px; border-radius: 10px; font-weight: 800; text-decoration: none; font-size: 15px; box-shadow: 0 4px 12px rgba(59,0,128,0.25);">
          Rate Your Delivery & Share Feedback →
        </a>
        <p style="margin: 10px 0 0 0; font-size: 11px; color: #6b7280;">Takes only 30 seconds · Live verification</p>
      </div>

      <!-- Order Recap Table -->
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Order ID</td>
          <td style="padding: 10px 0; font-weight: 700; color: #3b0080; font-family: monospace;">${order.id}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Assigned UAV</td>
          <td style="padding: 10px 0; font-weight: 700; color: #1e293b;">${droneModel}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Pickup</td>
          <td style="padding: 10px 0; color: #1e293b;">${order.pickup_address || 'Registered Hub'}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Drop Destination</td>
          <td style="padding: 10px 0; color: #1e293b;">${order.drop_address || 'Recipient Landing Zone'}</td>
        </tr>
      </table>

    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 18px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
      &copy; 2026 IndoWings Technologies. DGCA & Aerospace Compliance.<br>
      Sector 62, Noida, Uttar Pradesh · Helpline: 1800-IND-WINGS
    </div>
  </div>
</body>
</html>
`.trim();

  await sendEmail({ to, subject, text, html });
}

// ── 8. Support Query: Alert to Support Team ──────────────────────────────────
export async function sendSupportQueryAlertToTeam(query: any) {
  const to = 'connect@indowings.com';
  const subject = `[SUPPORT QUERY] ${query.priority ? `[${query.priority.toUpperCase()}]` : ''} Ticket ${query.id} - ${query.name || 'Customer'}`;
  const text = `
New Customer Query Submitted!

Ticket ID: ${query.id}
Customer: ${query.name} (${query.email || 'N/A'}, ${query.phone || 'N/A'})
Associated Order: ${query.order_id || 'N/A'}
Delivery Site Address: ${query.delivery_address || 'N/A'}
Drone Serial: ${query.drone_serial || 'N/A'}
Category: ${query.category || 'General'}
Priority: ${query.priority || 'Normal'}
Callback Preference: ${query.preferred_time || query.preferred_callback || 'N/A'}

Message / Query:
${query.message || 'No description provided.'}

Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
Manage in Support Desk: http://localhost:3000/support-desk
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #f8fafc; padding: 20px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
    <div style="background: #3b0080; padding: 20px; color: white;">
      <h2 style="margin: 0; font-size: 18px;">⚡ New Incoming Customer Query</h2>
      <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.8;">IndoFleet Central Grievance & Support Desk</p>
    </div>
    <div style="padding: 24px;">
      <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-weight: bold; font-size: 14px;">
        Ticket ID: <span style="color: #3b0080; font-family: monospace;">${query.id}</span>
        <span style="float: right; background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${(query.priority || 'NORMAL').toUpperCase()}</span>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 13px; line-height: 1.8;">
        <tr><td style="color: #64748b; width: 140px;">Customer Name:</td><td><strong>${query.name}</strong></td></tr>
        <tr><td style="color: #64748b;">Email Address:</td><td><a href="mailto:${query.email}">${query.email}</a></td></tr>
        <tr><td style="color: #64748b;">Phone Number:</td><td><a href="tel:${query.phone}">${query.phone}</a></td></tr>
        <tr><td style="color: #64748b;">Order Reference:</td><td><strong style="color: #3b0080; font-family: monospace;">${query.order_id || 'Not Linked'}</strong></td></tr>
        <tr><td style="color: #64748b;">Delivery Address:</td><td>${query.delivery_address || 'Not Provided'}</td></tr>
        <tr><td style="color: #64748b;">Drone Serial ID:</td><td>${query.drone_serial || 'N/A'}</td></tr>
        <tr><td style="color: #64748b;">Category:</td><td>${query.category || 'General Support'}</td></tr>
        <tr><td style="color: #64748b;">Callback Window:</td><td>${query.preferred_time || query.preferred_callback || 'Immediate'}</td></tr>
      </table>

      <div style="background: #f8fafc; border-left: 4px solid #3b0080; padding: 14px; margin-top: 20px; border-radius: 4px;">
        <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 4px;">Query Description</span>
        <p style="margin: 0; font-size: 14px; color: #1e293b; white-space: pre-wrap;">${query.message || 'No description provided.'}</p>
      </div>

      <div style="margin-top: 24px; text-align: center;">
        <a href="http://localhost:3000/support-desk" style="background: #3b0080; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">
          Open in Support Desk Console →
        </a>
      </div>
    </div>
  </div>
</body>
</html>
`.trim();

  await sendEmail({ to, subject, text, html });
}

// ── 9. Support Query: Resolution Notification to User ────────────────────────
export async function sendQueryResolutionEmail(query: any, resolutionNotes: string, agentName: string = 'IndoFleet Support') {
  if (!query.email) return;
  const to = query.email;
  const subject = `Your Support Query [${query.id}] Has Been Resolved - IndoFleet Support`;
  const text = `
Dear ${query.name || 'Valued Customer'},

Your support inquiry (Ticket ID: ${query.id}) regarding "${query.category || 'Support Request'}" has been resolved by our operations team.

Resolution & Action Taken:
------------------------------------
${resolutionNotes}
------------------------------------

Order Reference: ${query.order_id || 'N/A'}
Site Address: ${query.delivery_address || 'N/A'}
Resolved By: ${agentName}

If you have any further questions, you can contact our 24/7 Operations Support:
Phone: +91 7669478937 | Toll-Free: 1800 572 7363
Email: connect@indowings.com

Thank you for choosing IndoFleet Aerospace.
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #f8fafc; padding: 20px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
    <div style="background: #059669; padding: 20px; color: white;">
      <h2 style="margin: 0; font-size: 18px;">✅ Query Resolved: Ticket ${query.id}</h2>
      <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">IndoFleet Enterprise UAV Support Services</p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Dear <strong>${query.name || 'Valued Customer'}</strong>,<br>
        Our support operations team has reviewed and resolved your inquiry regarding <strong>${query.category || 'Flight Operations'}</strong>.
      </p>

      <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 10px; padding: 16px; margin: 20px 0;">
        <span style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; display: block; margin-bottom: 6px;">Official Resolution & Action Taken:</span>
        <p style="margin: 0; font-size: 14px; color: #14532d; line-height: 1.6; white-space: pre-wrap;">${resolutionNotes}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 13px; line-height: 1.8; margin-bottom: 20px;">
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="color: #64748b; padding: 6px 0;">Ticket Reference:</td><td style="font-family: monospace; font-weight: bold; color: #3b0080;">${query.id}</td></tr>
        ${query.order_id ? `<tr style="border-bottom: 1px solid #f1f5f9;"><td style="color: #64748b; padding: 6px 0;">Order Reference:</td><td style="font-family: monospace; font-weight: bold;">${query.order_id}</td></tr>` : ''}
        ${query.delivery_address ? `<tr style="border-bottom: 1px solid #f1f5f9;"><td style="color: #64748b; padding: 6px 0;">Delivery Address:</td><td>${query.delivery_address}</td></tr>` : ''}
        <tr><td style="color: #64748b; padding: 6px 0;">Resolved By:</td><td><strong>${agentName}</strong></td></tr>
      </table>

      <div style="background: #faf5ff; border: 1px dashed #c084fc; border-radius: 10px; padding: 14px; text-align: center; margin-top: 20px;">
        <p style="margin: 0; font-size: 12px; color: #6b21a8; font-weight: 600;">Need more assistance? Reach our 24/7 Operations Desk</p>
        <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 800; color: #3b0080;">
          📞 +91 7669478937 · Toll-Free: 1800 572 7363 · ✉️ connect@indowings.com
        </p>
      </div>
    </div>
    <div style="background: #f8fafc; padding: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
      &copy; 2026 IndoFleet Aerospace Technologies Ltd. All rights reserved.
    </div>
  </div>
</body>
</html>
`.trim();

  await sendEmail({ to, subject, text, html });
}

// ── 10. Direct Email Reply from Support Agent ─────────────────────────────────
export async function sendDirectSupportEmail(to: string, subject: string, message: string, agentName: string = 'IndoFleet Support Desk') {
  if (!to || !to.includes('@')) return;
  const text = `
Dear Customer,

${message}

------------------------------------
${agentName}
IndoFleet Aerospace Technologies Ltd.
Phone: +91 7669478937 | Toll-Free: 1800 572 7363
Email: connect@indowings.com
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #f8fafc; padding: 20px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
    <div style="background: #3b0080; padding: 18px 24px; color: white;">
      <h3 style="margin: 0; font-size: 16px;">IndoFleet Support Operations</h3>
      <p style="margin: 2px 0 0 0; font-size: 12px; opacity: 0.85;">Direct Message from Support Officer</p>
    </div>
    <div style="padding: 24px;">
      <div style="font-size: 14px; line-height: 1.7; color: #334155; white-space: pre-wrap; margin-bottom: 24px;">
        ${message}
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 12px; color: #64748b;">
        <strong style="color: #1e293b; display: block; font-size: 13px;">${agentName}</strong>
        Support & Operations Command Desk<br>
        IndoFleet Aerospace Technologies Ltd.<br>
        Direct Phone: +91 7669478937 · Toll-Free: 1800 572 7363 · Email: connect@indowings.com
      </div>
    </div>
  </div>
</body>
</html>
`.trim();

  await sendEmail({ to, subject, text, html });
}


