-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    features TEXT, -- JSON string of features
    max_employees INTEGER DEFAULT 50,
    active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create business subscriptions table
CREATE TABLE IF NOT EXISTS business_subscriptions (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    phone TEXT NOT NULL, -- Unique identifier for payment
    payment_method TEXT NOT NULL, -- card, upi, bank_transfer
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status TEXT DEFAULT 'active', -- active, expired, cancelled
    auto_renew BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id),
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

-- Create subscription payments table
CREATE TABLE IF NOT EXISTS subscription_payments (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    subscription_id TEXT NOT NULL,
    phone TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, completed, failed
    payment_date DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id),
    FOREIGN KEY (subscription_id) REFERENCES business_subscriptions(id)
);

-- Add subscription fields to businesses table
ALTER TABLE businesses ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE businesses ADD COLUMN subscription_end_date DATETIME;

-- Insert default subscription plans
INSERT OR IGNORE INTO subscription_plans (id, name, description, price, features, max_employees) VALUES
('basic-plan', 'Basic Plan', 'Perfect for small businesses with up to 10 employees', 499.00, '{"attendance": true, "payroll": true, "reports": true, "max_employees": 10}', 10),
('professional-plan', 'Professional Plan', 'Ideal for growing businesses with up to 50 employees', 999.00, '{"attendance": true, "payroll": true, "reports": true, "advances": true, "overtime": true, "max_employees": 50}', 50),
('enterprise-plan', 'Enterprise Plan', 'Complete solution for large businesses', 1999.00, '{"attendance": true, "payroll": true, "reports": true, "advances": true, "overtime": true, "api_access": true, "max_employees": 999}', 999);
