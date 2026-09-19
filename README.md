# IndoWings Aerial Logistics - Backend Engine

Autonomous drone dispatch, live flight telemetry simulation, and fleet management API engine built with Node.js, Express, and TypeScript for the IndoWings Autonomous Drone Delivery Network (DGCA Green Corridor compliant).

## Features
- **Fleet Management**: Live telemetry, battery health, payload capacities, status monitoring.
- **Flight Corridors & Order Dispatch**: Automated drone routing, ETA calculation, and dynamic flight phase updates.
- **Dual OTP Verification**: SMS OTP via Twilio / Supabase and Email OTP via Resend / Gmail SMTP.
- **AI Copilot & Tracking Bot**: Integrated intelligent chatbot endpoints for order lookup, name verification, and live telemetry HUD.
- **Admin & Analytics**: Order overview, flight statistics, feedback, and customer support desks.

## Tech Stack
- **Runtime**: Node.js & Express
- **Language**: TypeScript
- **Database**: File-based JSON store with real-time state persistence
- **Authentication**: JWT & OTP verification
- **Notifications**: Resend API, Gmail SMTP, Supabase/Twilio SMS gateway

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

