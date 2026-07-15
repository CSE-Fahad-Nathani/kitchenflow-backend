import pool from "../database/db.js";

export const addOrder = async (orderData) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      customer_id,
      customer_name,
      customer_mobile,
      delivery_datetime,
      delivery_charge,
      discount,
      other_charges,
      total_amount,
      bill_notes,
      items,
    } = orderData;

    // Name & mobile are optional
    const resolvedCustomerName =
      typeof customer_name === "string" && customer_name.trim()
        ? customer_name.trim()
        : null;
    const resolvedCustomerMobile =
      typeof customer_mobile === "string" && customer_mobile.trim()
        ? customer_mobile.trim()
        : null;

    // Generate Order Number
    const currentYear = new Date().getFullYear();

    const latestOrderQuery = `
      SELECT COALESCE(MAX(order_number), 0) AS last_order_number
      FROM orders
      WHERE order_number::TEXT LIKE $1;
    `;

    const latestOrderResult = await client.query(latestOrderQuery, [
      `${currentYear}%`,
    ]);

    let order_number;

    if (Number(latestOrderResult.rows[0].last_order_number) === 0) {
      order_number = Number(`${currentYear}00001`);
    } else {
      order_number =
        Number(latestOrderResult.rows[0].last_order_number) + 1;
    }

    const orderQuery = `
      INSERT INTO orders (
        order_number,
        customer_id,
        customer_name,
        customer_mobile,
        delivery_datetime,
        delivery_charge,
        discount,
        other_charges,
        total_amount,
        bill_notes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING
        order_id,
        order_number,
        delivery_datetime;
    `;

    const orderResult = await client.query(orderQuery, [
      order_number,
      customer_id || null,
      resolvedCustomerName,
      resolvedCustomerMobile,
      delivery_datetime,
      delivery_charge,
      discount,
      other_charges,
      total_amount,
      bill_notes,
    ]);

    const order = orderResult.rows[0];

    const itemQuery = `
      INSERT INTO order_items (
        order_id,
        dish_id,
        variant_id,
        dish_name,
        variant_name,
        quantity,
        unit_price,
        total_price
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8);
    `;

    for (const item of items) {
      await client.query(itemQuery, [
        order.order_id,
        item.dish_id,
        item.variant_id,
        item.dish_name,
        item.variant_name,
        item.quantity,
        item.unit_price,
        item.total_price,
      ]);
    }

    await client.query("COMMIT");

    return {
      order_id: order.order_id,
      order_number: order.order_number,

      customer_id: customer_id || null,
      customer_name: resolvedCustomerName,
      customer_mobile: resolvedCustomerMobile,

      delivery_datetime,

      delivery_charge,
      discount,
      other_charges,

      total_amount,
      bill_notes,

      is_paid: false,
      reminder_count: 0,

      items: items.map((item, index) => ({
        order_item_id: index,
        ...item,
      })),
    };

    
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getOrders = async () => {
  const query = `
    SELECT
      o.order_id,
      o.order_number,
      o.customer_id,
      o.customer_name,
      o.customer_mobile,
      o.delivery_datetime,
      o.delivery_charge,
      o.discount,
      o.other_charges,
      o.total_amount,
      o.bill_notes,
      o.is_paid,
      o.reminder_count,
      o.order_date,
      COALESCE(
        json_agg(
          json_build_object(
            'order_item_id', oi.order_item_id,
            'dish_id', oi.dish_id,
            'variant_id', oi.variant_id,
            'dish_name', oi.dish_name,
            'variant_name', oi.variant_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price
          )
          ORDER BY oi.created_at
        ) FILTER (WHERE oi.order_item_id IS NOT NULL),
        '[]'
      ) AS items
    FROM orders o
    LEFT JOIN order_items oi
      ON o.order_id = oi.order_id
    WHERE o.is_deleted = FALSE
    GROUP BY o.order_id
    ORDER BY o.order_number DESC;
  `;

  const result = await pool.query(query);

  return result.rows;
};


export const getTodaysOrders = async () => {
  const query = `
    SELECT
      o.order_id,
      o.order_number,
      o.customer_id,
      o.customer_name,
      o.customer_mobile,
      o.delivery_datetime,
      o.delivery_charge,
      o.discount,
      o.other_charges,
      o.total_amount,
      o.bill_notes,
      o.is_paid,
      o.reminder_count,
      o.order_date,
      COALESCE(
        json_agg(
          json_build_object(
            'order_item_id', oi.order_item_id,
            'dish_id', oi.dish_id,
            'variant_id', oi.variant_id,
            'dish_name', oi.dish_name,
            'variant_name', oi.variant_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price
          )
          ORDER BY oi.created_at
        ) FILTER (WHERE oi.order_item_id IS NOT NULL),
        '[]'
      ) AS items
    FROM orders o
    LEFT JOIN order_items oi
      ON o.order_id = oi.order_id
    WHERE
      o.is_deleted = FALSE
      AND DATE(o.delivery_datetime) = CURRENT_DATE
    GROUP BY o.order_id
    ORDER BY o.order_number DESC;
  `;

  const result = await pool.query(query);

  return result.rows;
};


export const markOrderPaid = async (order_id) => {
  const query = `
    UPDATE orders
    SET
      is_paid = TRUE,
      updated_at = CURRENT_TIMESTAMP
    WHERE
      order_id = $1
      AND is_deleted = FALSE
    RETURNING
      order_id,
      order_number,
      is_paid;
  `;

  const result = await pool.query(query, [order_id]);

  return result.rows[0];
};


export const deleteOrder = async (order_id) => {
  const query = `
    UPDATE orders
    SET
      is_deleted = TRUE,
      updated_at = CURRENT_TIMESTAMP
    WHERE
      order_id = $1
      AND is_deleted = FALSE
    RETURNING
      order_id,
      order_number;
  `;

  const result = await pool.query(query, [order_id]);

  return result.rows[0];
};

export const increaseReminderCount = async (order_id) => {
  const query = `
    UPDATE orders
    SET
      reminder_count = reminder_count + 1,
      last_reminder_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE
      order_id = $1
      AND is_deleted = FALSE
    RETURNING
      order_id,
      reminder_count,
      last_reminder_at;
  `;

  const result = await pool.query(query, [order_id]);

  return result.rows[0];
};

export const updateOrder = async (orderData) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      order_id,
      customer_id,
      customer_name,
      customer_mobile,
      delivery_datetime,
      delivery_charge,
      discount,
      other_charges,
      total_amount,
      bill_notes,
      items,
    } = orderData;

    const resolvedCustomerName =
      typeof customer_name === "string" && customer_name.trim()
        ? customer_name.trim()
        : null;
    const resolvedCustomerMobile =
      typeof customer_mobile === "string" && customer_mobile.trim()
        ? customer_mobile.trim()
        : null;

    await client.query(
      `
      UPDATE orders
      SET
        customer_id = $1,
        customer_name = $2,
        customer_mobile = $3,
        delivery_datetime = $4,
        delivery_charge = $5,
        discount = $6,
        other_charges = $7,
        total_amount = $8,
        bill_notes = $9,
        updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $10;
      `,
      [
        customer_id || null,
        resolvedCustomerName,
        resolvedCustomerMobile,
        delivery_datetime,
        delivery_charge,
        discount,
        other_charges,
        total_amount,
        bill_notes,
        order_id,
      ]
    );

    await client.query(
      `DELETE FROM order_items WHERE order_id = $1`,
      [order_id]
    );

    const itemQuery = `
      INSERT INTO order_items (
        order_id,
        dish_id,
        variant_id,
        dish_name,
        variant_name,
        quantity,
        unit_price,
        total_price
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8);
    `;

    for (const item of items) {
      await client.query(itemQuery, [
        order_id,
        item.dish_id,
        item.variant_id,
        item.dish_name,
        item.variant_name,
        item.quantity,
        item.unit_price,
        item.total_price,
      ]);
    }

    await client.query("COMMIT");

    const orderMeta = await client.query(
      `SELECT order_number FROM orders WHERE order_id = $1`,
      [order_id]
    );

    return {
      order_id,
      order_number: orderMeta.rows[0]?.order_number,

      customer_id: customer_id || null,
      customer_name: resolvedCustomerName,
      customer_mobile: resolvedCustomerMobile,

      delivery_datetime,
      delivery_charge,
      discount,
      other_charges,
      total_amount,
      bill_notes,

      items,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};



