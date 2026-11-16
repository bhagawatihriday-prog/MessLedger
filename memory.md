# MessLedger — Persistent Memory & Knowledge Base

**Document Type:** Project Memory & Architectural Decision Records (ADRs)  
**Maintenance:** Updated across conversational turns & architectural evolutions  
**Last Updated:** October 2026  

---

## 1. Project Overview & Identity

- **System:** MessLedger (Automated University Hostel Mess Billing & Dues Settlement System)
- **Primary Domain:** University campus hostels (e.g., Tezpur University).
- **Core Entities:** `Hostel`, `User` (`STUDENT`, `ADMIN`, `WARDEN`), `Boarder` (pre-registration directory), `Bill`, `Payment` (Razorpay transactions), `Notification`, `Rebate` (diet leave concessions).

---

## 2. Environment & Runtime Topology

| Component | Port / URI | Tech Stack | Notes |
| :--- | :--- | :--- | :--- |
| **Frontend** | `http://localhost:5173` | React 19, Vite, Tailwind CSS | Running with HMR. Uses Axios client with credentials. |
| **Backend** | `http://localhost:5000` | Node.js (ESM), Express.js | Running with `node --watch ./server.js`. |
| **Database** | Neon Cloud PostgreSQL | PostgreSQL 16 (Serverless) | Connects over WebSocket port 443 via `@neondatabase/serverless`. |
| **Payment Gateway**| `api.razorpay.com` | Razorpay Node SDK & Checkout.js | Supports Test Mode (`rzp_test_...`) and Live Mode (`rzp_live_...`). |

### Critical Environment Variables

#### `Backend/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://neondb_owner:npg_...@ep-....ap-southeast-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=super_secret_jwt_key_messledger_2026
CLIENT_URL=http://localhost:5173
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

#### `Frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

---

## 3. Architectural Decision Records (ADRs)

### ADR-01: Neon Serverless Database over WebSockets (Port 443)
- **Context:** Standard PostgreSQL connections run over TCP port 5432. Many university campus WiFi networks and regional Indian ISPs block non-standard database ports (5432) for security reasons.
- **Decision:** Use `@neondatabase/serverless` with the `ws` (WebSocket) driver.
- **Outcome:** All database queries tunnel over standard HTTPS WebSocket port 443. Guarantees 100% cloud connection reliability from any institutional network.

### ADR-02: Unified Razorpay Standard Checkout (No Manual Bank/UPI Forms)
- **Context:** Earlier mock designs included manual input fields for "Virtual Payment Address (VPA / UPI ID)", bank dropdowns, and an "Accepted Payment Channels" card.
- **Decision:** Removed all manual client-side UPI/VPA inputs and bank forms. Delegated checkout to the official Razorpay Standard Checkout popup (`checkout.js`).
- **Outcome:** Eliminates manual validation errors, achieves instant PCI-DSS Level 1 compliance, and enables dynamic UPI QR code scanning and app intent switching natively.

### ADR-03: Shared FIFO (First-In, First-Out) Payment Engine
- **Context:** Students often accumulate dues over multiple consecutive semesters. Allowing arbitrary month payment creates accounting chaos and leaves older late fines accruing indefinitely.
- **Decision:** All payments cascade strictly from the oldest unpaid bill cycle (`month_code ASC`) to the newest.
- **Outcome:** Past arrears must be settled before active cycles can be marked `PAID`. Guarantees clean university clearance auditing.

### ADR-04: Strict Admin-Only Room Reallocation
- **Context:** Students moving between rooms without warden authorization disrupts room capacity records, fire safety rosters, and billing accountability.
- **Decision:** Remove room editing from `EditProfile.jsx` and strip `room` from `PUT /api/user/profile`. Provide an admin-only reallocation endpoint `PUT /api/user/:id/room` and inline UI on the Admin Console.
- **Outcome:** 100% administrative integrity over room allocations with automatic student alert notifications.

### ADR-05: Late Fine 30-Day Penalty Cap (Max ₹600/month)
- **Context:** Uncapped late fines (₹20/day) can compound into unpayable amounts for economically disadvantaged students.
- **Decision:** Implement a hard statutory penalty cap at 30 penalty days (`Math.min(30, diffDays) * ₹20 = max ₹600.00`).
- **Outcome:** Encourages timely payment while complying with university student welfare policies.

### ADR-06: Dual Notification Dispatch on Payment
- **Context:** In hostel operations, wardens need immediate confirmation when students pay to verify mess clearance.
- **Decision:** On payment verification (or webhook), backend automatically identifies the student's hostel and inserts notifications for both the paying student and all administrators/wardens of that hostel.

---

## 4. Known Technical Gotchas & Critical Traps

1. **Express `rawBody` for Razorpay Webhooks:**
   - *Gotcha:* Razorpay calculates HMAC-SHA256 signatures over the exact raw HTTP request body string. If `express.json()` parses the stream before the buffer is captured, the reconstructed signature will fail.
   - *Rule:* Always capture `req.rawBody = buf;` inside the `verify` callback of `express.json()` in `Backend/src/app.js`.

2. **PostgreSQL Numeric vs. JavaScript Floats:**
   - *Gotcha:* PostgreSQL driver returns `NUMERIC` and `DECIMAL` column values as strings (e.g. `'2450.00'`) to prevent floating-point precision loss.
   - *Rule:* Always parse amounts using `parseFloat(row.amount || 0)` or `Number()` in controllers before performing mathematical operations.

3. **Database Transactions with Row-Level Locking:**
   - *Gotcha:* Rapid concurrent payment requests could double-credit bills without isolation.
   - *Rule:* Use `withTransaction` and append `FOR UPDATE` to the `SELECT * FROM bills WHERE user_id = $1 AND status != 'PAID'` query to lock the rows during settlement.

4. **No Cash / Offline Payment Re-introduction:**
   - *Constraint:* User explicitly instructed that no cash or offline payment features are to exist in the platform. Do not add offline receipt forms or cash toggle buttons.

---

## 5. Seed Accounts & Verification Reference

| Role | Name | Email | Assigned Hostel | Sample Roll / ID |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Hriday Bhagawati | `bhagawatihriday@gmail.com` | LBBH | `adm_1793172314386` |
| **Admin** | Hriday Bhagawati | `hridaybhagawati1913@gmail.com` | CMH | `adm_1793203009770` |
| **Student** | Hriday Bhagawati | `csb24019@tezu.ac.in` | CMH (Room 142) | `CSB24019` (`usr_1793203729150`) |
