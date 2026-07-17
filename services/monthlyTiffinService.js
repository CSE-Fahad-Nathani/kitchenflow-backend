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
  
        dish_name,
        variant_name,

        quantity,
        rate_per_day,

        delivery_charge,
        discount,

        total_amount,

        excluded_dates,
      } = billData;

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
          customer_id,
          customer_name,
          customer_mobile,
          from_date,
          to_date,
          dish_name,
          variant_name,
          quantity ?? 1,
          rate_per_day,
          delivery_charge,
          discount,
          total_amount,
        ]
      );
  
      const bill = billResult.rows[0];
  
      const excludedQuery = `
        INSERT INTO monthly_tiffin_excluded_dates (
            bill_id,
            excluded_date,
            reason
        )
        VALUES ($1, $2, $3);
        `;

        for (const excluded of excluded_dates || []) {
        await client.query(excludedQuery, [
            bill.bill_id,
            excluded.excluded_date,
            excluded.reason || "",
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
        bill_id,
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
        total_amount,
        is_paid,
        reminder_count
      FROM monthly_tiffin_bills
      WHERE
        is_deleted = FALSE
        AND (
          $1 = ''
          OR customer_name ILIKE '%' || $1 || '%'
          OR customer_mobile ILIKE '%' || $1 || '%'
        )
      ORDER BY from_date DESC;
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
        b.dish_name,
        b.variant_name,
        b.quantity,
        b.rate_per_day,
        b.delivery_charge,
        b.discount,
        b.total_amount,
        b.is_paid,
        b.reminder_count,
        b.last_reminder_at,
        COALESCE(
          json_agg(
            json_build_object(
              'excluded_id', e.excluded_id,
              'excluded_date', e.excluded_date,
              'reason', e.reason
            )
            ORDER BY e.excluded_date
          ) FILTER (WHERE e.excluded_id IS NOT NULL),
          '[]'
        ) AS excluded_dates
      FROM monthly_tiffin_bills b
      LEFT JOIN monthly_tiffin_excluded_dates e
        ON b.bill_id = e.bill_id
      WHERE
        b.bill_id = $1
        AND b.is_deleted = FALSE
      GROUP BY b.bill_id;
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


