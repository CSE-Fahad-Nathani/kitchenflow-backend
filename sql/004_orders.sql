CREATE TABLE IF NOT EXISTS orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number BIGINT UNIQUE NOT NULL,

    customer_id UUID REFERENCES customers(customer_id),

    customer_name VARCHAR(100),
    customer_mobile VARCHAR(15),

    delivery_charge DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    other_charges DECIMAL(10,2) DEFAULT 0,

    total_amount DECIMAL(10,2) NOT NULL,

    is_paid BOOLEAN DEFAULT FALSE,
    reminder_count INTEGER DEFAULT 0,

    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);