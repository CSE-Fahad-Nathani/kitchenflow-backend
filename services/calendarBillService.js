import pool from "../database/db.js";

export const createCalendarBill = async (billData) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      customer_id,
      customer_name,
      customer_mobile,
      show_dates,
      total_amount,
      dishes,
    } = billData;

    const billResult = await client.query(
      `
      INSERT INTO calendar_bills (
        customer_id,
        customer_name,
        customer_mobile,
        show_dates,
        total_amount
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING bill_id;
      `,
      [
        customer_id || null,
        customer_name,
        customer_mobile || "",
        Boolean(show_dates),
        total_amount,
      ]
    );

    const bill = billResult.rows[0];

    const dishQuery = `
      INSERT INTO calendar_bill_dishes (
        bill_id,
        dish_name,
        rate_per_day,
        quantity,
        delivery_charge_per_day
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING dish_entry_id;
    `;

    const dateQuery = `
      INSERT INTO calendar_bill_dish_dates (
        dish_entry_id,
        service_date
      )
      VALUES ($1, $2);
    `;

    for (const dish of dishes || []) {
      const dishResult = await client.query(dishQuery, [
        bill.bill_id,
        dish.dish_name,
        dish.rate_per_day,
        dish.quantity ?? 1,
        dish.delivery_charge_per_day || 0,
      ]);

      const dish_entry_id = dishResult.rows[0].dish_entry_id;
      const dates = [...new Set((dish.dates || []).map((d) => String(d).slice(0, 10)))];

      for (const service_date of dates) {
        await client.query(dateQuery, [dish_entry_id, service_date]);
      }
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

export const getCalendarBills = async (search = "") => {
  const query = `
    SELECT
      b.bill_id,
      b.customer_name,
      b.customer_mobile,
      b.show_dates,
      b.total_amount,
      b.is_paid,
      b.reminder_count,
      b.created_at,
      (
        SELECT COUNT(*)::int
        FROM calendar_bill_dishes d
        WHERE d.bill_id = b.bill_id
      ) AS dish_count,
      (
        SELECT COUNT(DISTINCT dd.service_date)::int
        FROM calendar_bill_dishes d
        JOIN calendar_bill_dish_dates dd ON dd.dish_entry_id = d.dish_entry_id
        WHERE d.bill_id = b.bill_id
      ) AS date_count
    FROM calendar_bills b
    WHERE
      b.is_deleted = FALSE
      AND (
        $1 = ''
        OR b.customer_name ILIKE '%' || $1 || '%'
        OR b.customer_mobile ILIKE '%' || $1 || '%'
      )
    ORDER BY b.created_at DESC;
  `;

  const result = await pool.query(query, [search]);
  return result.rows;
};

export const getCalendarBillById = async (bill_id) => {
  const query = `
    SELECT
      b.bill_id,
      b.customer_id,
      b.customer_name,
      b.customer_mobile,
      b.show_dates,
      b.total_amount,
      b.is_paid,
      b.reminder_count,
      b.last_reminder_at,
      b.created_at,
      COALESCE(
        (
          SELECT json_agg(dish_data ORDER BY (dish_data->>'created_at'))
          FROM (
            SELECT json_build_object(
              'dish_entry_id', d.dish_entry_id,
              'dish_name', d.dish_name,
              'rate_per_day', d.rate_per_day,
              'quantity', d.quantity,
              'delivery_charge_per_day', d.delivery_charge_per_day,
              'created_at', d.created_at,
              'dates', (
                SELECT COALESCE(
                  json_agg(dd.service_date ORDER BY dd.service_date),
                  '[]'
                )
                FROM calendar_bill_dish_dates dd
                WHERE dd.dish_entry_id = d.dish_entry_id
              )
            ) AS dish_data
            FROM calendar_bill_dishes d
            WHERE d.bill_id = b.bill_id
          ) sub
        ),
        '[]'
      ) AS dishes
    FROM calendar_bills b
    WHERE
      b.bill_id = $1
      AND b.is_deleted = FALSE;
  `;

  const result = await pool.query(query, [bill_id]);
  return result.rows[0];
};

export const deleteCalendarBill = async (bill_id) => {
  const query = `
    UPDATE calendar_bills
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

export const markCalendarBillPaid = async (bill_id) => {
  const query = `
    UPDATE calendar_bills
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

export const increaseCalendarBillReminder = async (bill_id) => {
  const query = `
    UPDATE calendar_bills
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
