# MessLedger — Database Relationships & Relational Schema Architecture

**Database Engine:** PostgreSQL 16 (Neon Serverless Cloud)  
**Access Protocol:** WebSockets (Port 443) via `@neondatabase/serverless`  
**Schema Version:** 1.0.0  
**Last Updated:** October 2026  

---

## 1. Executive Summary

The **MessLedger** persistence tier is built on a highly normalized relational model designed for strict financial auditability, zero data redundancy, and automated multi-table cascading.

The database consists of **7 core tables**:
1. `hostels` — The foundational institutional entity defining all residential campus blocks.
2. `users` — The core identity table managing authentication and role-based permissions (`STUDENT`, `ADMIN`, `WARDEN`).
3. `boarders` — The pre-authorization master directory ensuring only valid university residents can register.
4. `bills` — Monthly billing cycles, itemized fees, cumulative arrears, and daily late fines.
5. `payments` — Transaction ledger tracking Razorpay orders, payments, webhooks, and FIFO dues settlement.
6. `notifications` — In-app notification center for payment confirmations, admin alerts, and defaulter notices.
7. `rebates` — Diet leave concessions directly offsetting students' active billing liabilities.

---

## 2. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    HOSTELS ||--o{ USERS : "houses (hostel -> hostels.id)"
    HOSTELS ||--o{ BOARDERS : "pre-authorizes (logical)"
    USERS ||--o{ BILLS : "incurs dues (user_id -> users.id)"
    USERS ||--o{ PAYMENTS : "submits (user_id -> users.id)"
    USERS ||--o{ NOTIFICATIONS : "receives (user_id -> users.id)"
    USERS ||--|| REBATES : "granted (user_id -> users.id [1:1])"
    BILLS ||--o{ PAYMENTS : "allocated against (bill_id -> bills.id)"
    USERS ||--|| BOARDERS : "registered identity (roll_no <-> roll_no)"

    HOSTELS {
        varchar id PK "e.g. 'cmh', 'lbbh'"
        varchar name "Hostel Code e.g. 'CMH'"
        varchar full_name "Full official name"
        varchar type "CHECK ('MEN', 'WOMEN')"
        varchar senior_warden_id FK "REFERENCES users(id) ON DELETE SET NULL"
        varchar warden_id FK "REFERENCES users(id) ON DELETE SET NULL"
        text_array rooms "Available room roster"
        timestamp created_at
    }

    USERS {
        varchar id PK "e.g. 'usr_...', 'adm_...'"
        varchar name "User full name"
        varchar email UK "Institutional email"
        varchar password_hash "Bcrypt hash"
        varchar role "CHECK ('STUDENT', 'ADMIN', 'WARDEN')"
        varchar hostel FK "REFERENCES hostels(id)"
        varchar room "Assigned room number"
        varchar roll_no UK "University roll number"
        varchar phone "Contact number"
        varchar department "Academic department"
        text avatar_url "Profile avatar URI"
        timestamp created_at
        timestamp updated_at
    }

    BOARDERS {
        varchar id PK "e.g. 'brd_...'"
        varchar roll_no UK "Pre-authorized Roll No"
        varchar name "Student Full Name"
        varchar room "Allocated Room"
        varchar email "University Email"
        varchar hostel "Assigned Hostel Name/ID"
        varchar department "Academic Department"
        varchar phone "Contact Phone"
        timestamp created_at
    }

    BILLS {
        varchar id PK "e.g. 'bill_...'"
        varchar user_id FK "REFERENCES users(id) ON DELETE CASCADE"
        varchar month "Billing Month (e.g. 'September 2026')"
        varchar month_code "YYYY-MM (e.g. '2026-09')"
        numeric base_bill "Monthly mess charges"
        numeric paid_amount "Total paid towards this bill"
        numeric due_amount "Outstanding balance"
        numeric late_fine "Accumulated penalty"
        numeric previous_due "Arrears carried forward"
        numeric total_payable "Gross payable amount"
        integer fine_days "Penalty days accrued"
        numeric fine_per_day "Default ₹20.00"
        date payment_deadline "Payment cutoff date"
        varchar status "CHECK ('PAID', 'DUE', 'OVERDUE', 'PARTIAL')"
        varchar billing_cycle "Cycle label"
        jsonb meal_counts "Breakfast, lunch, dinner breakdown"
        timestamp created_at
    }

    PAYMENTS {
        varchar id PK "e.g. 'pay_...'"
        varchar bill_id FK "REFERENCES bills(id) ON DELETE SET NULL"
        varchar user_id FK "REFERENCES users(id) ON DELETE CASCADE"
        numeric amount "Amount paid in INR"
        varchar payment_method "UPI, NETBANKING, CARD, ONLINE"
        varchar transaction_id UK "Internal or Gateway Reference"
        varchar status "CHECK ('SUCCESS', 'PENDING', 'FAILED')"
        varchar razorpay_order_id "Gateway Order ID"
        varchar razorpay_payment_id "Gateway Payment ID"
        text razorpay_signature "Cryptographic HMAC Signature"
        text failure_reason "Bank decline reason if failed"
        numeric fee "Gateway transaction fee"
        numeric tax "GST on gateway fee"
        varchar idempotency_key UK "Duplicate submission guard"
        jsonb raw_response "Raw Razorpay payload"
        timestamp paid_at
    }

    NOTIFICATIONS {
        varchar id PK "e.g. 'notif_...'"
        varchar user_id FK "REFERENCES users(id) ON DELETE CASCADE"
        varchar title "Alert headline"
        text message "Alert description"
        varchar type "BILL, PAYMENT, INFO"
        boolean is_read "Read receipt flag"
        timestamp created_at
    }

    REBATES {
        varchar id PK "e.g. 'reb_...'"
        varchar user_id UK "REFERENCES users(id) ON DELETE CASCADE (1:1)"
        numeric amount "Total concession in INR"
        integer days "Approved leave days (min 3)"
        numeric daily_rate "Default ₹115.00/day"
        varchar calc_mode "DAYS or CUSTOM"
        varchar app_ref "Approval leave letter reference"
        varchar reason_category "ACADEMIC, MEDICAL, VACATION"
        date from_date "Leave start date"
        date to_date "Leave end date"
        text remarks "Warden remarks"
        timestamp created_at
        timestamp updated_at
    }
```

---

## 3. Relational Mapping Matrix

| Parent Table | Child Table | Foreign Key Column | Relationship Type | Delete Cascade Rule | Business Purpose |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `hostels` | `users` | `users.hostel` | **1 : Many** | `ON DELETE SET NULL` | Associates students and admins with their residential/administered hostel. If a hostel is removed, user accounts are preserved. |
| `users` | `bills` | `bills.user_id` | **1 : Many** | `ON DELETE CASCADE` | Connects monthly mess bills to the resident boarder. Deleting a student wipes their bill history. |
| `users` | `payments` | `payments.user_id` | **1 : Many** | `ON DELETE CASCADE` | Links financial transaction records to the paying student for ledger auditing. |
| `bills` | `payments` | `payments.bill_id` | **1 : Many** | `ON DELETE SET NULL` | Links payment to the primary bill settled. If a bill cycle is archived, historical payment receipts remain intact for audit compliance. |
| `users` | `notifications`| `notifications.user_id` | **1 : Many** | `ON DELETE CASCADE` | Delivers in-app alerts (billing notices, payment receipts, reminders) to the user's notification center. |
| `users` | `rebates` | `rebates.user_id` | **1 : 1** | `ON DELETE CASCADE` | Restricts each student to one active diet rebate concession that offsets their active monthly mess bill. |
| `boarders` | `users` | *(Logical)* `roll_no` | **1 : 1** | *(Application Guard)* | Connects the institutional pre-registration roster to the active student account. |

---

## 4. Deep Dive: Table Relationships & Architectural Workflows

### 4.1. The Root Entity: `hostels`
- **Role:** Central catalog representing all university residential hostels (e.g. `CMH`, `LBBH`, `DWH`).
- **Outgoing Relationships:**
  - `hostels.id` ➔ `users.hostel` (**1:N**): Defines which hostel an administrator supervises or which hostel a student resides in.
- **Normalized Authority Foreign Keys:**
  - `hostels` links to `users` via `senior_warden_id` and `warden_id` foreign keys with `ON DELETE SET NULL`.
  - All contact information (name, phone, email) is stored exclusively in `users` to eliminate redundant data.
  - When querying hostel details, a simple `LEFT JOIN users` provides current contact information.
  - When an administrator or warden account is deleted, PostgreSQL automatically nullifies `senior_warden_id` or `warden_id` natively.

---

### 4.2. Identity & Access: `users`
- **Role:** Central identity store for authentication (JWT), RBAC roles (`STUDENT`, `ADMIN`, `WARDEN`), and institutional attributes.
- **Incoming Relationships:**
  - Inherits `hostel` from `hostels.id`.
- **Outgoing Relationships:**
  - One user owns **Many Bills** (`bills.user_id`).
  - One user owns **Many Payments** (`payments.user_id` — intentionally preserved for lifetime audit retention).
  - One user receives **Many Notifications** (`notifications.user_id`).
  - One user holds **At Most One Active Rebate** (`rebates.user_id` has a `UNIQUE` constraint).
- **Administrative Access Boundaries:**
  - `ADMIN` and `WARDEN` users do **not** have entries in `bills` or `rebates`. Their dashboard aggregates the bills of all students residing in their designated `hostel`.

---

### 4.3. Pre-Authorization & Verification: `boarders`
- **Role:** Institutional whitelist uploaded by university administration via CSV or manual entry before student registration.
- **Relationship to `users`:**
  - Connected via the unique institutional key `roll_no` (`boarders.roll_no = users.roll_no`).
  - When a student registers on `/register`, the system verifies `boarders` matching their roll number, email, and hostel.
  - Registration status is computed **dynamically** via `LEFT JOIN users` (`u.id IS NOT NULL`). Zero duplicate flags or synchronization drift.
- **Automatic Deletion Handling:**
  - When an admin deletes a student account (`DELETE /api/user/:id`), removing the row from `users` automatically causes `is_registered` to evaluate to `FALSE` in real time with zero extra update queries needed.

---

### 4.4. Monthly Financial Ledger: `bills`
- **Role:** Stores the monthly charges, meal counts, late penalties, and payment status for students.
- **Key Fields & Formula Invariants:**
  - `base_bill`: The monthly baseline dining charge.
  - `previous_due`: Arrears carried forward from prior unsettled months.
  - `late_fine`: Daily penalty assessed past `payment_deadline` (capped at 30 days = max ₹600.00).
  - `total_payable = base_bill + late_fine + previous_due`.
  - `due_amount = Math.max(0, total_payable - paid_amount - rebateConcession)`.
- **Status Lifecycle (`status`):**
  ```
     [New Bill Created]
            │
            ▼
        ┌───────┐
        │  DUE  │ ──(Deadline passed & due > 0)──► ┌─────────┐
        └───┬───┘                                  │ OVERDUE │
            │                                      └────┬────┘
            │                                           │
  (Partial Payment)                           (Partial Payment)
            │                                           │
            ▼                                           ▼
      ┌───────────┐                               ┌───────────┐
      │  PARTIAL  │ ◄─────────────────────────────┤  PARTIAL  │
      └─────┬─────┘                               └─────┬─────┘
            │                                           │
      (Due reaches 0)                             (Due reaches 0)
            ▼                                           ▼
        ┌───────┐                                   ┌───────┐
        │ PAID  │                                   │ PAID  │
        └───────┘                                   └───────┘
  ```

---

### 4.5. Transaction Ledger & Gateway Auditing: `payments`
- **Role:** Immutable financial journal documenting every gateway attempt, capture, and settlement.
- **Dual Relationship:**
  - Belongs to `users` (`user_id` ➔ `users.id`): Identifies the student payer.
  - Belongs to `bills` (`bill_id` ➔ `bills.id`): Identifies the primary bill cycle settled.
- **First-In, First-Out (FIFO) Cascade Settlement:**
  - A single transaction in `payments` can allocate funds across **multiple** rows in `bills`.
  - When a student pays ₹5,000 against a ₹2,000 prior due and a ₹3,000 current due:
    1. Bill Cycle 1 (`2026-08`) receives ₹2,000 ➔ status updates to `PAID`, `due_amount = 0`.
    2. Bill Cycle 2 (`2026-09`) receives remaining ₹3,000 ➔ status updates to `PAID`, `due_amount = 0`.
    3. `payments.bill_id` points to the latest cycle (`2026-09`), while the payment record preserves the full ₹5,000 credited.
- **Idempotency & Gateway Security:**
  - `idempotency_key UNIQUE`: Prevents network retries from double-crediting.
  - `razorpay_payment_id`: Verified against HMAC-SHA256 signature before database commitment.

---

### 4.6. Messaging & Alerts: `notifications`
- **Role:** Delivers real-time notifications to users' notification bells and centers.
- **Dual Recipient Trigger on Payment:**
  Whenever a record is committed to `payments`, the backend automatically resolves relationships to create **two** notification entries:
  1. **Student Notice (`user_id = paying_student.id`):**
     - *Title:* "Payment Successful"
     - *Message:* "Mess dues payment of ₹... verified and credited. Ref: ..."
  2. **Hostel Admin Notice (`user_id = admin.id`):**
     - Queries: `SELECT id FROM users WHERE role IN ('ADMIN', 'WARDEN') AND hostel = student.hostel`
     - *Title:* "Mess Dues Payment Received"
     - *Message:* "Payment of ₹... received from [Name] ([Roll No], Room [Room])."

---

### 4.7. Leave Concessions: `rebates`
- **Role:** Tracks warden-approved leave absence concessions (minimum 3 days @ ₹115.00/day).
- **1:1 Constraint (`user_id UNIQUE`):**
  - Enforces that each student has at most one active rebate concession per active billing period.
- **Financial Deduction Workflow:**
  - `rebates.amount = rebates.days * rebates.daily_rate (₹115.00)`.
  - When the student views their bill or pays dues, `settleStudentDues` and `getCurrentBill` deduct `rebates.amount` directly from the net due.

---

## 5. Foreign Key Cascades & Data Integrity Rules

```
+------------------------------------------------------------------------------------+
| PARENT DELETE ACTION               | CHILD IMPACT                                  |
+------------------------------------+-----------------------------------------------+
| DELETE FROM hostels WHERE id = 'x' | users.hostel -> SET NULL                      |
|                                    | (Admins and students remain in system)        |
+------------------------------------+-----------------------------------------------+
| DELETE FROM users WHERE id = 'u'   | hostels.senior_warden_id / warden_id ->       |
|                                    |   SET NULL (Native PostgreSQL FK cascade)     |
|                                    | bills -> CASCADE (All student bills deleted)  |
|                                    | payments -> CASCADE (Transactions deleted)    |
|                                    | notifications -> CASCADE (Alerts deleted)     |
|                                    | rebates -> CASCADE (Rebate deleted)           |
|                                    | boarders registration -> dynamically FALSE    |
+------------------------------------+-----------------------------------------------+
| DELETE FROM bills WHERE id = 'b'   | payments.bill_id -> SET NULL                  |
|                                    | (Payment journal preserved for bank audits)   |
+------------------------------------+-----------------------------------------------+
```

---

## 6. Performance Indexes

To support rapid lookups across large student bodies and high-concurrency payment gateway webhooks, the following indexes are maintained:

```sql
-- Gateway Lookups (Used by Webhooks and Verification Handlers)
CREATE INDEX idx_payments_rzp_order ON payments(razorpay_order_id);
CREATE INDEX idx_payments_rzp_payment ON payments(razorpay_payment_id);

-- User Payment Ledger Query (Used by Student Dashboard & Admin Audit)
CREATE INDEX idx_payments_user_status ON payments(user_id, status);

-- Unique Identity Constraints (Implicit B-Tree Indexes)
-- users(email) UNIQUE
-- users(roll_no) UNIQUE
-- boarders(roll_no) UNIQUE
-- payments(transaction_id) UNIQUE
-- payments(idempotency_key) UNIQUE
-- rebates(user_id) UNIQUE
```
