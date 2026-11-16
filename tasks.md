# MessLedger — Task Tracking & Development Roadmap

**Document Status:** Live  
**Current Sprint:** Payment Gateway Verification & Admin Hardening  
**Last Updated:** October 2026  

---

## 1. Completed Milestones

### Milestone 1: Core Foundation & Master Access Directory
- [x] Set up React 19 + Vite frontend with Tailwind CSS and Zinc/Emerald theme tokens.
- [x] Configure Express backend with ES modules, CORS, cookie-parser, and secure JWT authentication.
- [x] Implement Pre-Authorized Resident Student Directory (`boarders` table) with single entry and CSV bulk import.
- [x] Role-Based Access Control (RBAC) supporting `STUDENT`, `ADMIN`, and `WARDEN` roles.
- [x] User registration flow verifying institutional roll number and pre-assigned hostel against the master list.

### Milestone 2: Cloud Database Migration (Neon PostgreSQL)
- [x] Migrate development storage from local fallback to Neon Serverless PostgreSQL cloud instance.
- [x] Implement WebSocket pool connection (`@neondatabase/serverless` + `ws`) over port 443 to bypass strict university ISP and firewall port 5432 blocks.
- [x] Execute relational database migrations for `hostels`, `users`, `boarders`, `bills`, `payments`, `notifications`, and `rebates`.
- [x] Implement atomic transaction helper `withTransaction` for reliable rollbacks and ACID compliance.

### Milestone 3: Monthly Billing, Late Fine & Diet Rebate Engines
- [x] Build 1-click bulk and single student mess bill generation modal with automated student alert broadcast.
- [x] Implement automated daily late fine penalty engine (₹20/day) with statutory cap at 30 penalty days (max ₹600 per month).
- [x] Implement Diet Rebate Concession engine calculating ₹115.00/day for approved leaves (≥ 3 days).
- [x] Build live financial reconciliation preview for diet rebates before warden approval.
- [x] Cumulative multi-month arrears rollup linking prior unpaid cycles to current bill.

### Milestone 4: Razorpay Payment Gateway & FIFO Settlement
- [x] Integrate official Razorpay Node.js SDK and client-side `checkout.js` dynamic script loader.
- [x] Implement Full and Partial Payment support with custom amount input (minimum ₹100).
- [x] Build shared FIFO payment settlement engine cascading payments from oldest arrears to newest active cycles.
- [x] Support online payment channels: UPI QR code, UPI intent apps, Debit/Credit Cards, and Net Banking inside unified Razorpay modal.
- [x] Implement server-side HMAC-SHA256 signature verification with `crypto.timingSafeEqual` and duplicate idempotency prevention.
- [x] Implement resilient server-to-server webhook endpoint (`/api/payments/webhook`) handling `payment.captured`, `order.paid`, and `payment.failed`.
- [x] Add dedicated `Status` column with colored badges (`SUCCESS`, `PENDING`, `FAILED`) to desktop tables, mobile cards, and "View All" modal.
- [x] Generate printable computer-generated electronic payment receipt vouchers (`PaymentReceiptModal`).

### Milestone 5: Real-Time Dual Notifications & Defaulter Reminders
- [x] Automatically dispatch payment confirmation notifications to paying student boarders.
- [x] Implement automatic hostel admin resolution: whenever a student pays, all administrators and wardens assigned to that student's hostel receive a real-time payment notification.
- [x] Implement "Send Reminders" button in Admin Console: scans all defaulters (`UNPAID` / `PARTIALLY_PAID`) in the admin's hostel and dispatches personalized balance alerts in 1 click.
- [x] Real-time notification bell dropdown with unread badge counter and "Mark all read" action.

### Milestone 6: Access Control Hardening & Room Allocation
- [x] Restrict student boarders from modifying their room number in profile settings (strictly read-only with administrative guidance).
- [x] Disallow room updates in `PUT /api/user/profile` on the backend to prevent API-level tampering.
- [x] Implement admin-only room reallocation endpoint `PUT /api/user/:id/room` updating both `users` and `boarders` tables.
- [x] Add "Change Room" inline reallocation modal to the Admin Dashboard student breakdown view.
- [x] Dispatch automated in-app notification to students upon room reallocation.

---

## 2. Active / Immediate Tasks

- [ ] **Live Razorpay Keys Configuration:**
  - Transition from development simulation fallback to active Razorpay Test Keys (`rzp_test_...` and secret) from Razorpay Dashboard.
- [ ] **User Acceptance Testing (UAT):**
  - Verify complete checkout popup using simulated UPI QR code and test cards on `http://localhost:5173`.
- [ ] **Webhook Local Tunneling (Optional for local testing):**
  - Configure ngrok tunnel (`ngrok http 5000`) to test asynchronous webhook delivery during local development.

---

## 3. Future Roadmap / Product Backlog

| Priority | Task Description | Expected Impact |
| :---: | :--- | :--- |
| **High** | **Automated Email Notifications (Nodemailer / SendGrid)**<br>Send official PDF receipt vouchers to student university emails upon verified payment. | Eliminates student need to manually print or download slips for office submissions. |
| **High** | **Production Cloud Deployment**<br>Deploy Frontend to Vercel/Netlify and Backend to Render/Railway with SSL and production domain. | Makes portal accessible outside campus LAN to remote and day-scholar students. |
| **Medium** | **Semester Mess Clearance Certificate**<br>Generate digital clearance certificate with university QR verification code when all semester dues reach ₹0. | Speeds up end-semester exam admit card and hostel deposit refunds. |
| **Medium** | **Super Admin Multi-Hostel Global Dashboard**<br>Institutional view allowing Dean of Student Welfare (DSW) to view financial health across all campus hostels. | Central university budgeting and vendor procurement oversight. |
| **Low** | **Automated Monthly Invoicing Cron Job**<br>Optional recurring scheduler to auto-generate baseline bills on the 1st of every month without manual admin triggering. | Full hands-off billing automation for routine hostel cycles. |
