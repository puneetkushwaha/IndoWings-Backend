# IndoWings Aerial Logistics - Backend Engine

Autonomous drone dispatch, live flight telemetry simulation, and fleet management API engine built with Node.js, Express, and TypeScript for the IndoWings Autonomous Drone Delivery Network (DGCA Green Corridor compliant).

## Environment Variables (.env)

Create a `.env` file in the root of the `server` directory with the following variables:

```env
PORT=5000
SUPABASE_URL=https://jycdvbdncdmidnyitfpv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5Y2R2YmRuY2RtaWRueWl0ZnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NDE5ODEsImV4cCI6MjEwNTMxNzk4MX0.fw2WucIzrV5cZ3ukjUviCgsfrRvvuwxy2yR0wKCw690
JWT_SECRET=indowings_command_center_secret_2026

ADMIN_EMAIL=puneet@indowings.com
ADMIN_PASSWORD=123123
ADMIN_NAME=Puneet Kushwaha

RAZORPAY_KEY_ID=rzp_live_SKjbolJvdxju2R
RAZORPAY_KEY_SECRET=10mEY4hiJfOEU7ZR5srJGJM0

# Resend Mailer Key (Format: re_iUpWeC4X_AWPXyiee...)
RESEND_API_KEY=re_iUpWeC4X_AWPXyieeDzKHFFG8Kyf8UfuX_LIVE
FROM_EMAIL=onboarding@dev2dev.online
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=puneetkushwaha9452@gmail.com
SMTP_PASS=gnjbwticrobmnshz

# ServiceHub Supabase Phone OTP Gateway
SERVICEHUB_SUPABASE_URL=https://tpypyxuvmtzhoncasiln.supabase.co
SERVICEHUB_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRweXB5eHV2bXR6aG9uY2FzaWxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMjUwOTgsImV4cCI6MjA5ODkwMTA5OH0.LKnoEJrdlg_KZv8UMmA381rseSH20edvls1urlafwHw

# Firebase Project Config (indofleet-e3ef8)
FIREBASE_PROJECT_ID=indofleet-e3ef8
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Fast2SMS Gateway Configuration
FAST2SMS_API_KEY=
```

## Features
- **Fleet Management**: Live telemetry, battery health, payload capacities, status monitoring.
- **Flight Corridors & Order Dispatch**: Automated drone routing, ETA calculation, and dynamic flight phase updates.
- **Dual OTP Verification**: SMS OTP via Twilio / Supabase / Firebase Phone Auth and Email OTP via Resend / Gmail SMTP.
- **AI Copilot & Tracking Bot**: Integrated intelligent chatbot endpoints for order lookup, name verification, and live telemetry HUD.
- **Admin & Analytics**: Order overview, flight statistics, feedback, and customer support desks.

## Tech Stack
- **Runtime**: Node.js & Express
- **Language**: TypeScript
- **Database**: File-based JSON store with real-time state persistence
- **Authentication**: JWT & OTP verification (Firebase / Supabase)
- **Notifications**: Resend API, Gmail SMTP, Firebase FCM Push

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm start
```
