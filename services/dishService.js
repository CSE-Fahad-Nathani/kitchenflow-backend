import pool from "../database/db.js";

export const addDish = async ({ dish_name, category, variants }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const dishQuery = `
      INSERT INTO dishes (dish_name, category)
      VALUES ($1, $2)
      RETURNING dish_id, dish_name, category, is_deleted, created_at, updated_at;
    `;

    const dishResult = await client.query(dishQuery, [dish_name, category]);

    const dish = dishResult.rows[0];

    const variantQuery = `
      INSERT INTO dish_variants (dish_id, variant_name, price)
      VALUES ($1, $2, $3)
      RETURNING variant_id, variant_name, price;
    `;

    const savedVariants = [];

    for (const variant of variants) {
      const result = await client.query(variantQuery, [
        dish.dish_id,
        variant.variant_name,
        variant.price,
      ]);

      savedVariants.push(result.rows[0]);
    }

    await client.query("COMMIT");

    return {
      ...dish,
      variants: savedVariants,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};



export const getDishes = async () => {
    const query = `
      SELECT
        d.dish_id,
        d.dish_name,
        d.category,
        d.created_at,
        d.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'variant_id', dv.variant_id,
              'variant_name', dv.variant_name,
              'price', dv.price
            )
            ORDER BY dv.variant_name
          ) FILTER (WHERE dv.variant_id IS NOT NULL),
          '[]'
        ) AS variants
      FROM dishes d
      LEFT JOIN dish_variants dv
        ON d.dish_id = dv.dish_id
        AND dv.is_deleted = FALSE
      WHERE d.is_deleted = FALSE
      GROUP BY d.dish_id
      ORDER BY d.dish_name;
    `;
  
    const result = await pool.query(query);
  
    return result.rows;
  };



  export const searchDishes = async (search) => {
    const query = `
      SELECT
        d.dish_id,
        d.dish_name,
        d.category,
        COALESCE(
          json_agg(
            json_build_object(
              'variant_id', dv.variant_id,
              'variant_name', dv.variant_name,
              'price', dv.price
            )
            ORDER BY dv.variant_name
          ) FILTER (WHERE dv.variant_id IS NOT NULL),
          '[]'
        ) AS variants
      FROM dishes d
      LEFT JOIN dish_variants dv
        ON d.dish_id = dv.dish_id
        AND dv.is_deleted = FALSE
      WHERE d.is_deleted = FALSE
        AND d.dish_name ILIKE $1
      GROUP BY d.dish_id
      ORDER BY d.dish_name
      LIMIT 10;
    `;
  
    const result = await pool.query(query, [`%${search}%`]);
  
    return result.rows;
  };




  export const updateDish = async ({
    dish_id,
    dish_name,
    category,
    variants,
  }) => {
    const client = await pool.connect();
  
    try {
      await client.query("BEGIN");
  
      const dishQuery = `
        UPDATE dishes
        SET
          dish_name = $1,
          category = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE dish_id = $3
          AND is_deleted = FALSE
        RETURNING dish_id, dish_name, category, is_deleted, created_at, updated_at;
      `;
  
      const dishResult = await client.query(dishQuery, [
        dish_name,
        category,
        dish_id,
      ]);
  
      if (dishResult.rows.length === 0) {
        throw new Error("Dish not found");
      }
  
      // Soft delete old variants instead of deleting them
      await client.query(
        `
        UPDATE dish_variants
        SET
          is_deleted = TRUE,
          updated_at = CURRENT_TIMESTAMP
        WHERE dish_id = $1;
        `,
        [dish_id]
      );
  
      const variantQuery = `
        INSERT INTO dish_variants (
          dish_id,
          variant_name,
          price,
          is_deleted
        )
        VALUES ($1, $2, $3, FALSE)
        RETURNING variant_id, variant_name, price;
      `;
  
      const savedVariants = [];
  
      for (const variant of variants) {
        const result = await client.query(variantQuery, [
          dish_id,
          variant.variant_name,
          variant.price,
        ]);
  
        savedVariants.push(result.rows[0]);
      }
  
      await client.query("COMMIT");
  
      return {
        ...dishResult.rows[0],
        variants: savedVariants,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  };





  export const deleteDish = async (dish_id) => {
    const client = await pool.connect();
  
    try {
      await client.query("BEGIN");
  
      await client.query(
        `
        UPDATE dish_variants
        SET
          is_deleted = TRUE,
          updated_at = CURRENT_TIMESTAMP
        WHERE dish_id = $1;
        `,
        [dish_id]
      );
  
      const result = await client.query(
        `
        UPDATE dishes
        SET
          is_deleted = TRUE,
          updated_at = CURRENT_TIMESTAMP
        WHERE dish_id = $1
        RETURNING dish_id, dish_name;
        `,
        [dish_id]
      );
  
      await client.query("COMMIT");
  
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  };



  