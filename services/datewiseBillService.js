import pool from "../database/db.js";


export const createDatewiseBill = async (billData) => {
    const client = await pool.connect();
  
    try {
      await client.query("BEGIN");
  
      const {
        customer_id,
        customer_name,
        customer_mobile,
        discount,
        total_amount,
        days,
      } = billData;
  
      const billResult = await client.query(
        `
        INSERT INTO datewise_bills (
          customer_id,
          customer_name,
          customer_mobile,
          discount,
          total_amount
        )
        VALUES ($1,$2,$3,$4,$5)
        RETURNING bill_id;
        `,
        [
          customer_id,
          customer_name,
          customer_mobile,
          discount,
          total_amount,
        ]
      );
  
      const bill = billResult.rows[0];
  
      const dayQuery = `
            INSERT INTO datewise_bill_days (
                bill_id,
                bill_date,
                delivery_charge,
                note
            )
            VALUES ($1,$2,$3,$4)
            RETURNING day_id;
            `;

            const itemQuery = `
            INSERT INTO datewise_bill_items (
                day_id,
                dish_name,
                variant_name,
                quantity,
                price,
                note
            )
            VALUES ($1,$2,$3,$4,$5,$6);
            `;

            for (const day of days || []) {
            const dayResult = await client.query(dayQuery, [
                bill.bill_id,
                day.bill_date,
                day.delivery_charge || 0,
                day.note || "",
            ]);

            const day_id = dayResult.rows[0].day_id;

            for (const item of day.items || []) {
                await client.query(itemQuery, [
                day_id,
                item.dish_name,
                item.variant_name || "",
                item.quantity,
                item.price,
                item.note || "",
                ]);
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

  export const getDatewiseBills = async (search = "") => {
    const query = `
      SELECT
        bill_id,
        customer_name,
        customer_mobile,
        discount,
        total_amount,
        created_at
      FROM datewise_bills
      WHERE
        is_deleted = FALSE
        AND (
          $1 = ''
          OR customer_name ILIKE '%' || $1 || '%'
          OR customer_mobile ILIKE '%' || $1 || '%'
        )
      ORDER BY created_at DESC;
    `;
  
    const result = await pool.query(query, [search]);
  
    return result.rows;
  };


  export const getDatewiseBillById = async (bill_id) => {
    const query = `
      SELECT
        b.bill_id,
        b.customer_id,
        b.customer_name,
        b.customer_mobile,
        b.discount,
        b.total_amount,
        COALESCE(
          json_agg(
            json_build_object(
              'day_id', d.day_id,
              'bill_date', d.bill_date,
              'delivery_charge', d.delivery_charge,
              'note', d.note,
              'items', (
                SELECT COALESCE(
                  json_agg(
                    json_build_object(
                      'item_id', i.item_id,
                      'dish_name', i.dish_name,
                      'variant_name', i.variant_name,
                      'quantity', i.quantity,
                      'price', i.price,
                      'note', i.note
                    )
                    ORDER BY i.created_at
                  ),
                  '[]'
                )
                FROM datewise_bill_items i
                WHERE i.day_id = d.day_id
              )
            )
            ORDER BY d.bill_date
          ) FILTER (WHERE d.day_id IS NOT NULL),
          '[]'
        ) AS days
      FROM datewise_bills b
      LEFT JOIN datewise_bill_days d
        ON b.bill_id = d.bill_id
      WHERE
        b.bill_id = $1
        AND b.is_deleted = FALSE
      GROUP BY b.bill_id;
    `;
  
    const result = await pool.query(query, [bill_id]);
  
    return result.rows[0];
  };


  export const deleteDatewiseBill = async (bill_id) => {
    const query = `
      UPDATE datewise_bills
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











