CREATE TABLE IF NOT EXISTS dish_variants (
    variant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dish_id UUID NOT NULL REFERENCES dishes(dish_id) ON DELETE CASCADE,
    variant_name VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);