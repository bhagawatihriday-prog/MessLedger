# MessLedger — UI/UX Design System Specification

**Design Version:** 1.0.0  
**Design System Name:** Zinc & Emerald Institutional Ledger  
**Primary Archetype:** University Financial Portal & Modern FinTech Ledger  

---

## 1. Design Philosophy & Visual Principles

1. **Academic Authority & Institutional Trust:**
   - Visual styling reflects the dignity and structure of a central university administrative body (clean lines, crisp 1px borders, subtle surface elevations).
2. **FinTech Clarity & Zero Ambiguity:**
   - Financial figures, due deadlines, and reconciliation calculations are given visual hierarchy with contrasting typographic weights and dedicated status badges.
3. **Harmonious Dark & Light Modes:**
   - Both modes are first-class citizens. Surfaces shift between crisp paper white (`#FFFFFF`) with subtle zinc backgrounds in light mode, to deep obsidian zinc (`#09090B`) with elevated slate cards in dark mode.
4. **Dynamic Feedback & Micro-Interactions:**
   - Hover states, loading spinners, and glowing status dots reassure users during asynchronous financial transactions.

---

## 2. Color System & Design Tokens

### 2.1. Neutral Surface Scale (`Zinc`)

| Token | Light Mode Value | Dark Mode Value | Usage |
| :--- | :--- | :--- | :--- |
| **Background** | `zinc-50` (`#FAFAFA`) | `zinc-950` (`#09090B`) | Overall application viewport background |
| **Card Surface** | `white` (`#FFFFFF`) | `zinc-900` (`#18181B`) | Card containers, modals, table rows |
| **Border Subdued** | `zinc-200` (`#E4E4E7`) | `zinc-800` (`#27272A`) | Container dividers, table row borders |
| **Border Active** | `zinc-300` (`#D4D4D8`) | `zinc-700` (`#3F3F46`) | Input field borders, hover outlines |
| **Text Primary** | `zinc-950` (`#09090B`) | `zinc-50` (`#FAFAFA`) | Page titles, primary numbers, strong labels |
| **Text Muted** | `zinc-500` (`#71717A`) | `zinc-400` (`#A1A1AA`) | Helper text, secondary descriptions |

### 2.2. Semantic Contextual Accents

| Context | Light Theme Token | Dark Theme Token | Semantic Meaning |
| :--- | :--- | :--- | :--- |
| **Success / Paid** | `emerald-600` (`#059669`) / `emerald-50` | `emerald-400` (`#34D399`) / `emerald-950/60` | Full settlement, payment verified, credit |
| **Warning / Partial** | `amber-600` (`#D97706`) / `amber-50` | `amber-400` (`#FBBF24`) / `amber-950/60` | Partial payment, pending settlement, dues |
| **Danger / Overdue** | `rose-600` (`#E11D48`) / `rose-50` | `rose-400` (`#FB7185`) / `rose-950/60` | Late fines accrued, overdue bills, declined |
| **Info / Notice** | `blue-600` (`#2563EB`) / `blue-50` | `blue-400` (`#60A5FA`) / `blue-950/60` | General notices, announcements |

---

## 3. Typography Hierarchy

- **Font Family:** Modern Sans-Serif (`Inter`, `system-ui`, `-apple-system`, `sans-serif`)
- **Monospace Family:** High-legibility mono (`ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`) for **Roll Numbers**, **Transaction Reference IDs**, and **Currency Values**.

| Level | Size | Weight | Line Height | Tracking | Application |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / H1** | `24px` (`text-2xl`) | Bold (`font-bold`) | `1.25` | `tracking-tight` | Page headers, Hero stats |
| **Heading / H2** | `18px` (`text-lg`) | Bold (`font-bold`) | `1.3` | `tracking-normal` | Section titles, Card headers |
| **Subheading / H3**| `14px` (`text-sm`) | Semibold (`font-semibold`) | `1.4` | `tracking-normal` | Modal titles, Group headers |
| **Body** | `13px` (`text-xs`) | Regular (`font-normal`) | `1.5` | `tracking-normal` | Table content, form inputs, notes |
| **Caption / Badge**| `10px - 11px` | Medium / Bold | `1.2` | `tracking-wider` | Metric labels, status indicators |

---

## 4. Reusable Component Specifications

### 4.1. `StatusBadge`
- Renders an enclosed pill with a glowing colored status dot and uppercase label:
  - `PAID` / `FULLY_PAID` / `SUCCESS`: Emerald glow dot + emerald badge.
  - `PARTIAL` / `PARTIALLY_PAID` / `PENDING`: Amber glow dot + amber badge.
  - `DUE` / `OVERDUE` / `FAILED`: Rose glow dot + rose badge.

### 4.2. `StatCard`
- Used across the Admin Console and Student Dashboard.
- Features:
  - Metric title in muted uppercase typography (`text-[10px] tracking-wider`).
  - Large currency or counter value in bold (`text-xl font-bold`).
  - Contextual subtext (e.g. `94% collection rate`, `1 student with dues`).
  - Subtle top-right icon badge.

### 4.3. Dual Responsive Table / Card Pattern
- **Desktop / Tablet (`≥ 640px`):**
  - Crisp tabular layout with sticky headers, uppercase muted column titles, monospace reference IDs, right-aligned monetary values, and action icons.
- **Mobile (`< 640px`):**
  - Switches to stacked card view.
  - Left side: Direction arrow icon, transaction title, date.
  - Right side: Monospace amount, colored status badge.
  - Tap card opens full receipt modal.

### 4.4. `PaymentReceiptModal` (Printable Electronic Voucher)
- Designed to replicate physical university fee slips:
  - Official university header and central hostel administration crest badge.
  - Dual metadata header: Receipt Number, Issue Date, Billing Cycle, Verification Stamp (`PAID & VERIFIED`).
  - Boarder Particulars Grid: Student Name, Roll Number, Hostel, Room Number, Department.
  - Itemized Financial Table: Base Fee, Late Penalties, Diet Rebate Concessions, Total Settled.
  - Security Disclaimer: Computer-generated authentication notice (no physical signature required).
  - `@media print` CSS rules hide web navbars, buttons, and footers, rendering a clean, single-page printable PDF voucher.

---

## 5. UI Layout Structure

```
+-------------------------------------------------------------------------+
| [LOGO] MessLedger     [Console] [Boarders]      (Bell) [Theme] [Profile]|
+-------------------------------------------------------------------------+
|                                                                         |
|  Welcome back, [User Name]  •  [Hostel Name]  •  [Role Badge]           |
|                                                                         |
|  +--------------------+  +--------------------+  +-------------------+  |
|  | Total Billed       |  | Total Collected    |  | Outstanding Dues  |  |
|  | ₹24,500.00         |  | ₹18,650.00         |  | ₹5,850.00         |  |
|  +--------------------+  +--------------------+  +-------------------+  |
|                                                                         |
|  [Main Ledger Section / Active Bill Breakdown]                          |
|  +-------------------------------------------------------------------+  |
|  | Search bar...                    [Filters: ALL | PAID | DUE]     |  |
|  +-------------------------------------------------------------------+  |
|  | Roll No  | Student Name | Room | Total | Paid | Due | Status      |  |
|  | CSB24019 | Hriday B.    | 142  | 2,450 | 2,450|  0  | [PAID]      |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  (Footer) Tezpur University • Central Hostel Management System          |
+-------------------------------------------------------------------------+
```
