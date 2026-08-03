import pool from "../database/db.js";

export const createMonthlyTiffinBill = async (billData) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      customer_id,
      customer_name,
      customer_mobile,
      from_date,
      to_date,
      discount,
      total_amount,
      dishes,
      excluded_dates,
    } = billData;

    const dishesList = Array.isArray(dishes) ? dishes : [];
    const first = dishesList[0] || {};

    const billResult = await client.query(
      `
      INSERT INTO monthly_tiffin_bills (
        customer_id,
        customer_name,
        customer_mobile,
        from_date,
        to_date,
        dish_name,
        variant_name,
        quantity,
        rate_per_day,
        delivery_charge,
        discount,
        total_amount
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING bill_id;
      `,
      [
        customer_id || null,
        customer_name,
        customer_mobile || "",
        from_date,
        to_date,
        first.dish_name || null,
        first.variant_name || "",
        first.quantity ?? 1,
        first.rate_per_day ?? null,
        first.delivery_charge_per_day ?? 0,
        discount || 0,
        total_amount,
      ]
    );

    const bill = billResult.rows[0];

    const dishQuery = `
      INSERT INTO monthly_tiffin_bill_dishes (
        bill_id,
        dish_name,
        variant_name,
        rate_per_day,
        quantity,
        delivery_charge_per_day
      )
      VALUES ($1,$2,$3,$4,$5,$6);
    `;

    for (const dish of dishesList) {
      await client.query(dishQuery, [
        bill.bill_id,
        dish.dish_name,
        dish.variant_name || "",
        dish.rate_per_day,
        dish.quantity ?? 1,
        dish.delivery_charge_per_day || 0,
      ]);
    }

    const excludedQuery = `
      INSERT INTO monthly_tiffin_excluded_dates (
        bill_id,
        excluded_date,
        reason
      )
      VALUES ($1, $2, $3);
    `;

    const excludedList = excluded_dates || [];
    for (const excluded of excludedList) {
      const date =
        typeof excluded === "string" ? excluded : excluded?.excluded_date;
      if (!date) continue;
      await client.query(excludedQuery, [
        bill.bill_id,
        String(date).slice(0, 10),
        (typeof excluded === "object" && excluded?.reason) || "",
      ]);
    }

    await client.query("COMMIT");
    return bill;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getMonthlyTiffinBills = async (search = "") => {
  const query = `
    SELECT
      b.bill_id,
      b.customer_name,
      b.customer_mobile,
      b.from_date,
      b.to_date,
      b.discount,
      b.total_amount,
      b.is_paid,
      b.reminder_count,
      (
        SELECT COUNT(*)::int
        FROM monthly_tiffin_bill_dishes d
        WHERE d.bill_id = b.bill_id
      ) AS dish_count,
      COALESCE(
        (
          SELECT d.dish_name
          FROM monthly_tiffin_bill_dishes d
          WHERE d.bill_id = b.bill_id
          ORDER BY d.created_at
          LIMIT 1
        ),
        b.dish_name
      ) AS dish_name,
      COALESCE(
        (
          SELECT d.variant_name
          FROM monthly_tiffin_bill_dishes d
          WHERE d.bill_id = b.bill_id
          ORDER BY d.created_at
          LIMIT 1
        ),
        b.variant_name
      ) AS variant_name
    FROM monthly_tiffin_bills b
    WHERE
      b.is_deleted = FALSE
      AND (
        $1 = ''
        OR b.customer_name ILIKE '%' || $1 || '%'
        OR b.customer_mobile ILIKE '%' || $1 || '%'
      )
    ORDER BY b.from_date DESC;
  `;

  const result = await pool.query(query, [search]);
  return result.rows;
};

export const getMonthlyTiffinBillById = async (bill_id) => {
  const query = `
    SELECT
      b.bill_id,
      b.customer_id,
      b.customer_name,
      b.customer_mobile,
      b.from_date,
      b.to_date,
      b.discount,
      b.total_amount,
      b.is_paid,
      b.reminder_count,
      b.last_reminder_at,
      COALESCE(
        (
          SELECT json_agg(dish_data ORDER BY (dish_data->>'created_at'))
          FROM (
            SELECT json_build_object(
              'dish_entry_id', d.dish_entry_id,
              'dish_name', d.dish_name,
              'variant_name', d.variant_name,
              'rate_per_day', d.rate_per_day,
              'quantity', d.quantity,
              'delivery_charge_per_day', d.delivery_charge_per_day,
              'created_at', d.created_at
            ) AS dish_data
            FROM monthly_tiffin_bill_dishes d
            WHERE d.bill_id = b.bill_id
          ) sub
        ),
        CASE
          WHEN b.dish_name IS NOT NULL THEN
            json_build_array(
              json_build_object(
                'dish_name', b.dish_name,
                'variant_name', b.variant_name,
                'rate_per_day', b.rate_per_day,
                'quantity', b.quantity,
                'delivery_charge_per_day', b.delivery_charge
              )
            )
          ELSE '[]'::json
        END
      ) AS dishes,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'excluded_id', e.excluded_id,
              'excluded_date', e.excluded_date,
              'reason', e.reason
            )
            ORDER BY e.excluded_date
          )
          FROM monthly_tiffin_excluded_dates e
          WHERE e.bill_id = b.bill_id
        ),
        '[]'
      ) AS excluded_dates
    FROM monthly_tiffin_bills b
    WHERE
      b.bill_id = $1
      AND b.is_deleted = FALSE;
  `;

  const result = await pool.query(query, [bill_id]);
  return result.rows[0];
};

export const deleteMonthlyTiffinBill = async (bill_id) => {
  const query = `
    UPDATE monthly_tiffin_bills
    SET
      is_deleted = TRUE,
      updated_at = CURRENT_TIMESTAMP
    WHERE
      bill_id = $1
      AND is_deleted = FALSE
    RETURNING
      bill_id,
      customer_name;
  `;

  const result = await pool.query(query, [bill_id]);
  return result.rows[0];
};

export const markMonthlyTiffinBillPaid = async (bill_id) => {
  const query = `
    UPDATE monthly_tiffin_bills
    SET
      is_paid = TRUE,
      updated_at = CURRENT_TIMESTAMP
    WHERE
      bill_id = $1
      AND is_deleted = FALSE
    RETURNING
      bill_id,
      is_paid;
  `;

  const result = await pool.query(query, [bill_id]);
  return result.rows[0];
};

export const increaseMonthlyTiffinReminder = async (bill_id) => {
  const query = `
    UPDATE monthly_tiffin_bills
    SET
      reminder_count = reminder_count + 1,
      last_reminder_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE
      bill_id = $1
      AND is_deleted = FALSE
    RETURNING
      bill_id,
      reminder_count,
      last_reminder_at;
  `;

  const result = await pool.query(query, [bill_id]);
  return result.rows[0];
};
