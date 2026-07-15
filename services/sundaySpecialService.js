import pool from "../database/db.js";


export const createSundaySpecial = async (specialData) => {
    const client = await pool.connect();
  
    try {
      await client.query("BEGIN");
  
      const {
        special_date,
        title,
        items,
      } = specialData;
  
      const specialResult = await client.query(
        `
        INSERT INTO sunday_specials (
          special_date,
          title
        )
        VALUES ($1, $2)
        RETURNING special_id, special_date, title;
        `,
        [
          special_date,
          title || "Sunday Special",
        ]
      );
  
      const special = specialResult.rows[0];
  
      const itemQuery = `
  INSERT INTO sunday_special_items (
    special_id,
    dish_name,
    quantity,
    price,
    note,
    display_order
  )
  VALUES ($1, $2, $3, $4, $5, $6);
`;

for (let i = 0; i < items.length; i++) {
  const item = items[i];

  await client.query(itemQuery, [
    special.special_id,
    item.dish_name,
    item.quantity,
    item.price,
    item.note || "",
    i + 1,
  ]);
}
  
      await client.query("COMMIT");
  
      return special;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  };



  export const getSundaySpecials = async (search = "") => {
    const query = `
      SELECT
        s.special_id,
        s.special_date,
        s.title,
        COUNT(i.item_id) AS total_items
      FROM sunday_specials s
      LEFT JOIN sunday_special_items i
        ON s.special_id = i.special_id
      WHERE
        s.is_deleted = FALSE
        AND (
          $1 = ''
          OR TO_CHAR(s.special_date, 'DD Mon YYYY') ILIKE '%' || $1 || '%'
        )
      GROUP BY s.special_id
      ORDER BY s.special_date DESC;
    `;
  
    const result = await pool.query(query, [search]);
  
    return result.rows;
  };


  export const getSundaySpecialById = async (special_id) => {
    const query = `
      SELECT
        s.special_id,
        s.special_date,
        s.title,
        COALESCE(
          json_agg(
            json_build_object(
              'item_id', i.item_id,
              'dish_name', i.dish_name,
              'quantity', i.quantity,
              'price', i.price,
              'note', i.note
            )
            ORDER BY i.display_order
          ) FILTER (WHERE i.item_id IS NOT NULL),
          '[]'
        ) AS items
      FROM sunday_specials s
      LEFT JOIN sunday_special_items i
        ON s.special_id = i.special_id
      WHERE
        s.special_id = $1
        AND s.is_deleted = FALSE
      GROUP BY s.special_id;
    `;
  
    const result = await pool.query(query, [special_id]);
  
    return result.rows[0];
  };

  export const deleteSundaySpecial = async (special_id) => {
    const query = `
      UPDATE sunday_specials
      SET
        is_deleted = TRUE,
        updated_at = CURRENT_TIMESTAMP
      WHERE
        special_id = $1
        AND is_deleted = FALSE
      RETURNING
        special_id,
        special_date;
    `;
  
    const result = await pool.query(query, [special_id]);
  
    return result.rows[0];
  };