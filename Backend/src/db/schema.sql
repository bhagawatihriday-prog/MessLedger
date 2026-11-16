-- MessLedger Database Schema (PostgreSQL)

-- 1. Create Hostels Table
CREATE TABLE IF NOT EXISTS hostels (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    type VARCHAR(10) NOT NULL DEFAULT 'MEN' CHECK (type IN ('MEN', 'WOMEN')),
    senior_warden_id VARCHAR(50),
    warden_id VARCHAR(50),
    rooms TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(20) DEFAULT 'STUDENT' CHECK (role IN ('STUDENT', 'SENIOR_WARDEN', 'WARDEN', 'ADMIN')),
    designation VARCHAR(100) DEFAULT 'Resident Student',
    hostel VARCHAR(50) REFERENCES hostels(id) ON DELETE SET NULL,
    room VARCHAR(20),
    roll_no VARCHAR(50) UNIQUE,
    phone VARCHAR(30),
    department VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Foreign Key Constraints for Hostels Authority
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_hostels_senior_warden'
    ) THEN
        ALTER TABLE hostels 
        ADD CONSTRAINT fk_hostels_senior_warden 
        FOREIGN KEY (senior_warden_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_hostels_warden'
    ) THEN
        ALTER TABLE hostels 
        ADD CONSTRAINT fk_hostels_warden 
        FOREIGN KEY (warden_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Create Boarders Master List Table (Institutional Pre-Registration Whitelist)
CREATE TABLE IF NOT EXISTS boarders (
    id VARCHAR(50) PRIMARY KEY,
    roll_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    room VARCHAR(20),
    email VARCHAR(150) NOT NULL,
    hostel VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    phone VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_boarders_email_unique ON boarders (LOWER(email));

-- 4. Create Bills Table
CREATE TABLE IF NOT EXISTS bills (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    month VARCHAR(50) NOT NULL,
    month_code VARCHAR(10) NOT NULL,
    base_bill NUMERIC(10, 2) DEFAULT 0,
    paid_amount NUMERIC(10, 2) DEFAULT 0,
    due_amount NUMERIC(10, 2) DEFAULT 0,
    late_fine NUMERIC(10, 2) DEFAULT 0,
    previous_due NUMERIC(10, 2) DEFAULT 0,
    total_payable NUMERIC(10, 2) DEFAULT 0,
    fine_days INTEGER DEFAULT 0,
    fine_per_day NUMERIC(10, 2) DEFAULT 20,
    payment_deadline DATE,
    status VARCHAR(20) DEFAULT 'DUE' CHECK (status IN ('PAID', 'DUE', 'OVERDUE', 'PARTIAL')),
    billing_cycle VARCHAR(100),
    meal_counts JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Payments / Transactions Table
-- (user_id is intentionally preserved alongside bill_id for permanent historical ledger integrity)
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(50) PRIMARY KEY,
    bill_id VARCHAR(50) REFERENCES bills(id) ON DELETE SET NULL,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'ONLINE',
    transaction_id VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'PENDING', 'FAILED')),
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature TEXT,
    failure_reason TEXT,
    fee NUMERIC(10, 2) DEFAULT 0,
    tax NUMERIC(10, 2) DEFAULT 0,
    idempotency_key VARCHAR(100) UNIQUE,
    raw_response JSONB,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_rzp_order ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_rzp_payment ON payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, status);

-- 6. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Rebates Table
CREATE TABLE IF NOT EXISTS rebates (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    days INTEGER DEFAULT 0,
    daily_rate NUMERIC(10, 2) DEFAULT 115,
    calc_mode VARCHAR(20) DEFAULT 'DAYS',
    app_ref VARCHAR(100),
    reason_category VARCHAR(50),
    from_date DATE,
    to_date DATE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial Seed Data: Official Tezpur University Hostels
INSERT INTO hostels (id, name, full_name, type)
VALUES 
('cmh', 'CMH', 'Charaideo Men''s Hostel', 'MEN'),
('nmh', 'NMH', 'Nilachal Men''s Hostel', 'MEN'),
('kmh', 'KMH', 'Kanchenjunga Men''s Hostel', 'MEN'),
('pmh', 'PMH', 'Patkai Men''s Hostel', 'MEN'),
('scvrmh', 'SCVRMH', 'Saraighat C. V. Raman Men''s Hostel', 'MEN'),
('tmh', 'TMH', 'Transit Men''s Hostel', 'MEN'),
('bwh', 'BWH', 'Bordoichila Women''s Hostel', 'WOMEN'),
('dwh', 'DWH', 'Dhansiri Women''s Hostel', 'WOMEN'),
('pwh', 'PWH', 'Pragjyotika Women''s Hostel', 'WOMEN'),
('swh', 'SWH', 'Subansiri Women''s Hostel', 'WOMEN'),
('kwh', 'KWH', 'Kopili Women''s Hostel', 'WOMEN'),
('nwh', 'NWH', 'New Women''s Hostel', 'WOMEN'),
('lbbh', 'LBBH', 'Lachit Borphukan Boys'' Hostel', 'MEN'),
('kbgh', 'KBGH', 'Kanaklata Baruah Girls'' Hostel', 'WOMEN'),
('twh', 'TWH', 'Transit Women''s Hostel', 'WOMEN')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    type = EXCLUDED.type;
