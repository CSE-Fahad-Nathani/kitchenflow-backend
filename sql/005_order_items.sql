CREATE TABLE IF NOT EXISTS order_items (
    order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,

    dish_id UUID REFERENCES dishes(dish_id),
    variant_id UUID REFERENCES dish_variants(variant_id),

    dish_name VARCHAR(100) NOT NULL,
    variant_name VARCHAR(50),

    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);