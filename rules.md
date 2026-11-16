# MessLedger — Rules & Engineering Guidelines

**Document Version:** 1.0.0  
**Enforcement Level:** Mandatory across all Frontend, Backend, and Database development  

---

## 1. Architectural & Scope Constraints

### 1.1. No Offline / Cash Payment Features
- **Strict Rule:** Under no circumstances should offline or cash payment options, forms, or manual cashier receipts be reintroduced.
- **Rationale:** The system is explicitly designed for electronic payment reconciliation via Razorpay. Offline tracking creates reconciliation discrepancies and audit liability.

### 1.2. Strict Room Allocation Role Boundaries
- **Strict Rule:** Student boarders are **strictly forbidden** from self-modifying their hostel room numbers.
- **Enforcement:**
  - In Frontend: Room input in `EditProfile.jsx` must remain `disabled` / read-only with administrative guidance helper text.
  - In Backend: `PUT /api/user/profile` must ignore/strip any `room` property submitted by non-admin users.
  - Only administrators or wardens (`role IN ('ADMIN', 'WARDEN')`) can reallocate rooms via `PUT /api/user/:id/room` or `PUT /api/boarders/:id`.

---

## 2. Business Logic Invariants

### 2.1. Late Fine Assessment & Statutory Cap
- **Formula:** `overdueDays = Math.max(0, Math.floor((currentDate - paymentDeadline) / (1000 * 60 * 60 * 24)))`
- **Rate:** ₹20.00 / day past payment deadline.
- **Penalty Cap:** Capped at a strict maximum of **30 penalty days** (`Math.min(30, overdueDays) = max ₹600.00 per month`).
- **Paid Protection:** Once a bill is marked `PAID`, late fines are frozen and must never increase.

### 2.2. Diet Rebate Calculation
- **Eligibility:** Approved absence leave letters granted by the hostel warden (minimum 3 consecutive days).
- **Statutory Daily Rate:** **₹115.00 / day**.
- **Concession Formula:** `Rebate Amount = Approved Days × ₹115.00`.
- **Ledger Offset:** Directly reduces the gross mess charge (`Math.max(0, grossBill - rebateAmount)`), reducing the net amount payable before payment allocation.

### 2.3. FIFO Payment Allocation Invariant
- **Strict Rule:** Payment amounts must cascade strictly from the **oldest unpaid bill cycle to the newest**.
- **Execution:**
  1. Fetch all unpaid bills ordered by `month_code ASC`.
  2. Deduct unallocated funds from the earliest due bill.
  3. Mark bill as `PAID` if remaining due reaches 0.
  4. Mark bill as `PARTIAL` if remaining due > 0 and paid > 0.
  5. Advance remaining unallocated funds to the next bill.
  6. Never mark a newer bill as `PAID` while prior months remain unsettled.

### 2.4. Dual Stakeholder Notification Invariant
- Every successful payment settlement (whether verified via client redirect or gateway webhook) must create two distinct notifications:
  1. A confirmation notification for the **paying student boarder**.
  2. A receipt notification for the **hostel administrator(s) and warden(s)** assigned to that student's hostel.

---

## 3. Backend & Security Standards

### 3.1. SQL Injection Prevention
- **Strict Rule:** Never use string concatenation or template literals (`${}`) to build SQL queries.
- **Standard:** Use parameterized queries with `$1, $2, ...` placeholders at all times:
  ```javascript
  // CORRECT:
  await query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);

  // FORBIDDEN:
  await query(`SELECT * FROM users WHERE email = '${email}'`);
  ```

### 3.2. Atomic Database Transactions
- **Strict Rule:** Any database operation that alters bills, creates payment records, or executes financial allocation **must** be executed within an atomic transaction.
- Use `withTransaction(async (client) => { ... })` to ensure automatic `BEGIN`, `COMMIT`, and `ROLLBACK` on error.
- Use PostgreSQL `FOR UPDATE` row-level locks on target bill records during settlement to prevent race conditions.

### 3.3. Timing-Safe Cryptographic Validation
- **Strict Rule:** Always use `crypto.timingSafeEqual` for HMAC signature validation to prevent side-channel timing attacks:
  ```javascript
  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
  const isMatch = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  ```

### 3.4. Razorpay Webhook Raw Body
- Webhook signature verification requires the **exact raw request buffer**.
- Backend middleware must preserve `req.rawBody`:
  ```javascript
  app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
  ```

---

## 4. Frontend & UI Guidelines

### 4.1. Design Aesthetics & Color Tokens
- **Theme Palette:** Strictly adhere to the `zinc` neutral palette with curated contextual accents:
  - **Success / Collections / Paid:** Emerald (`emerald-600`, `emerald-50`, dark: `emerald-400`, `emerald-950/60`).
  - **Warning / Partial / Dues:** Amber (`amber-500`, `amber-50`, dark: `amber-400`, `amber-950/60`).
  - **Danger / Overdue / Late Fines:** Rose (`rose-600`, `rose-50`, dark: `rose-400`, `rose-950/60`).
- **Zero Generic Colors:** Avoid plain red, green, or blue browser defaults.

### 4.2. Responsive Display Standard
- **Dual Table / Card Pattern:**
  - Table view on desktop and tablet screens (`hidden sm:block`).
  - Stacked card view on mobile screens (`sm:hidden`).
- Ensure no table causes horizontal viewport overflows on mobile devices.

### 4.3. Currency & Date Formatting
- Always use utility helpers:
  - Currency: `formatCurrency(amount)` (outputs standard `₹2,450.00`).
  - Dates: `formatDate(dateString)` (outputs localized `DD MMM YYYY`).
  - Relative Time: `formatRelativeTime(timestamp)` (e.g., `2 hours ago`).
