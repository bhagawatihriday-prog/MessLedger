# MessLedger — Product Requirements Document (PRD)

**Project Name:** MessLedger  
**Target Domain:** University Central Hostel Mess Financial Accounting & Dues Settlement  
**Target Institutions:** Higher Education Campuses (e.g., Tezpur University)  
**Document Version:** 1.0.0  
**Status:** Active / Production Ready  

---

## 1. Executive Summary

**MessLedger** is an automated, web-based hostel mess dues management and electronic payment reconciliation platform. It replaces manual paper ledgers, fragmented bank transfer receipts, and error-prone spreadsheet calculations with a centralized, transparent ledger for university students, hostel wardens, and mess committee administrators.

The system automates the complete billing lifecycle: generating monthly mess bills, computing late fines with penalty caps, deducting approved diet rebates, processing real-time electronic payments via Razorpay (supporting full and partial settlements), and notifying stakeholders of financial transactions.

---

## 2. Problem Statement & User Pain Points

| Stakeholder | Legacy Pain Points | MessLedger Solution |
| :--- | :--- | :--- |
| **Student Boarders** | • Long queues at warden office to submit bank counterfoils<br>• Confusion over cumulative arrears and daily late fines<br>• Inability to pay partially when facing temporary financial strain<br>• Lack of immediate payment receipts for semester registration clearance | • 24/7 web checkout via Razorpay (UPI, Cards, NetBanking)<br>• Transparent itemized billing breakdown with daily fine trackers<br>• Flexible Partial and Full dues settlement<br>• Instant computer-generated e-receipts and print vouchers |
| **Hostel Wardens & Admins** | • Manual tracking of hundreds of resident students' payment slips<br>• Reconciling diet rebate leave applications against messy billing sheets<br>• Manual calculation of overdue penalty days per resident<br>• High rate of payment defaults without automated reminder mechanisms | • 1-Click bulk & single monthly bill generation with automated alerts<br>• Automated diet rebate deduction engine (₹115/day calculation)<br>• Automated daily late fine engine with 30-day penalty cap<br>• "Send Reminders" button targeting all defaulters across the hostel |
| **University Administration** | • Fragmented hostel financial accounts with poor visibility<br>• Risk of student dispute on room reallocation and mess charges | • Consolidated multi-hostel cloud database (Neon PostgreSQL)<br>• Strictly controlled room allocations and audit notifications |

---

## 3. User Personas & Roles

### 3.1. Resident Student / Boarder (`role: 'STUDENT'`)
- Registered resident living in a university hostel (e.g., CMH, LBBH, DWH).
- Capabilities:
  - View current month's active mess bill, meal counts, and due dates.
  - Review cumulative prior arrears, itemized base charges, and late penalty accruals.
  - Make Full or Partial dues payments via Razorpay payment gateway.
  - View ledger transaction history with gateway reference IDs and live status badges (`SUCCESS`, `PENDING`, `FAILED`).
  - View and print official university payment vouchers / electronic receipts.
  - Receive in-app notifications for bill publishing, payment confirmations, payment reminders, and administrative room reallocations.
  - Edit personal profile details (contact phone, profile avatar), with room allocation locked to administrative control.

### 3.2. Hostel Administrator / Superintendent / Warden (`role: 'ADMIN'` / `'WARDEN'`)
- Responsible for mess accounting, boarder rosters, and financial clearances in their assigned hostel.
- Capabilities:
  - Dashboard analytics: Total Billed, Total Collected, Outstanding Arrears, and Collection Rate percentage.
  - Generate monthly mess bills in bulk for all registered residents or selectively for a single student.
  - Disallow future/invalid billing periods; default due dates with automated notification broadcast.
  - Dispatch automated bulk payment reminder notifications to all students with overdue balances in 1 click.
  - Grant, adjust, or revoke Diet Rebate concessions based on approved leave letters with live financial impact previews.
  - Reallocate student room numbers directly from the student modal or master boarder roster.
  - Pre-authorize new resident boarders manually or via bulk CSV spreadsheet import.
  - Permanently delete user accounts and clear billing records when students graduate or leave the hostel.
  - Export hostel ledger data to spreadsheet (CSV format).

---

## 4. Key Functional Modules & Requirements

### 4.1. Authentication & Master Pre-Registration Roster
- **Pre-Authorized Roster (`boarders` table):**
  - Admins upload CSV or enter boarders with `rollNo`, `name`, `room`, `email`, `hostel`, `department`.
  - Only pre-authorized students can register an account; registration claims and activates the boarder record (`is_registered = TRUE`).
- **Session Management:** Secure HTTP-only JWT cookies with bcrypt password hashing.
- **Role-Based Access Control (RBAC):** Strict middleware guards (`authenticate`, `requireAdmin`).

### 4.2. Monthly Billing Engine
- **Generation:** Admin specifies `month`, `monthCode`, `baseBill`, `paymentDeadline`, `billingCycle`, and target (`ALL` residents vs `SINGLE`).
- **Cumulative Calculation:** Automatically links any unpaid prior balances (`previous_due`) to current month total payable.
- **Notification Trigger:** Generates in-app alert for all affected students upon bill creation.

### 4.3. Automated Late Fine Penalty Calculation
- **Daily Penalty:** ₹20 / day assessed for every overdue day past `payment_deadline`.
- **Statutory Cap:** Maximum penalty capped at 30 days (₹600 max per monthly cycle) to comply with university welfare standards.
- **Automatic Recalculation:** Recomputed on bill access and payment settlement.

### 4.4. Diet Rebate Concession Engine
- **Eligible Absence:** Minimum university leave policy (typically ≥ 3 consecutive days absence).
- **Statutory Daily Rate:** ₹115 / day meal deduction.
- **Concession Formula:** `Rebate Amount = Absence Days × ₹115.00`.
- **Bill Impact:** Directly offsets remaining net due on the student's active bill with live preview before approval.

### 4.5. Razorpay Payment Gateway & Transaction Settlement
- **Online Checkout:** Razorpay Standard Checkout modal supporting UPI (QR code scan, app intents), Debit/Credit Cards, and Net Banking.
- **Payment Types:**
  - **FULL Payment:** Settles entire outstanding balance.
  - **PARTIAL Payment:** Allows custom minimum amount (minimum ₹100 up to total due).
- **FIFO Settlement:** Allocated funds cascade strictly from oldest unpaid arrears to newest active cycles.
- **Status Reporting:** Every transaction displays `status` (`SUCCESS`, `PENDING`, `FAILED`) across table views, mobile cards, and e-receipts.
- **Bi-Directional Updates:**
  - Boarder bill updates to `PAID` or `PARTIAL`; "Pay Now" updates to "No outstanding payment for this cycle".
  - Admin dashboard collection metrics and student status update instantly.
- **Hostel Admin Alert:** Automatically detects student's hostel and notifies wardens upon verified payment.
- **Webhooks:** Server-to-server webhook endpoint (`/api/payments/webhook`) with HMAC-SHA256 signature verification for asynchronous reconciliation.

### 4.6. Administrative Room Allocation Security
- **Strict Role Boundary:** Boarders are explicitly restricted from modifying their room number in profile settings.
- **Administrative Control:** Only hostel admins/wardens can reallocate room numbers via the dashboard modal or master roster.
- **Audit Sync & Notification:** Changes update both `users` and `boarders` tables and dispatch an in-app notice to the student.

### 4.7. Automated Defaulter Payment Reminders
- **1-Click Broadcast:** "Send Reminders" button scans admin's hostel for students with `UNPAID` or `PARTIALLY_PAID` status.
- **Custom Alert:** Injects alert with student's exact total balance and earliest deadline.

---

## 5. Non-Functional Requirements

### 5.1. Security & Compliance
- **PCI-DSS Compliance:** Zero cardholder or bank account data stored on MessLedger servers; all card and UPI processing delegated to Razorpay's PCI-DSS Level 1 certified gateway.
- **Cryptographic Verification:** HMAC-SHA256 signatures validated using Node.js `crypto.timingSafeEqual` to prevent timing attacks.
- **Idempotency:** Payment records enforce UNIQUE `idempotency_key` and unique `razorpay_payment_id` to eliminate double-crediting.
- **Concurrency Control:** Critical payment settlement executes inside PostgreSQL database transactions with `FOR UPDATE` row locking.

### 5.2. Performance & Reliability
- **Cloud Database:** Neon Serverless PostgreSQL running over secure WebSockets (port 443) to guarantee 100% connectivity across strict university ISP/firewall blocks (port 5432).
- **Fast Client:** Vite-bundled React frontend with zero render latency and optimized build footprint.
- **Resilient Fallbacks:** Client-side mock mode fallback enables local testing even during database disconnects.

### 5.3. Usability & Aesthetics
- **Design System:** Professional university-grade dark and light theme using curated `zinc` and `emerald` color palettes.
- **Responsive Layout:** 100% responsive across desktop workstations, tablets, and smartphones.
- **Printable Vouchers:** CSS `@media print` optimized electronic receipts formatted for physical submission or PDF export.
