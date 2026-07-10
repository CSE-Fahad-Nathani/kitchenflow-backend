import pool from "../database/db.js";

export const createCustomer = async ({ name, mobile, address, notes }) => {
  const query = `
    INSERT INTO customers (name, mobile, address, notes)
    VALUES ($1, $2, $3, $4)
    RETURNING customer_id, name, mobile, address, notes, is_deleted, created_at, updated_at;
  `;

  const values = [name, mobile, address, notes];

  const result = await pool.query(query, values);

  return result.rows[0];
};




export const getCustomers = async () => {
    const query = `
      SELECT *
      FROM customers
      WHERE is_deleted = FALSE
      ORDER BY name ASC;
    `;
  
    const result = await pool.query(query);
  
    return result.rows;
  };



  export const searchCustomers = async (search) => {
    const query = `
      SELECT *
      FROM customers
      WHERE is_deleted = FALSE
        AND name ILIKE $1
      ORDER BY name ASC
      LIMIT 10;
    `;
  
    const result = await pool.query(query, [`%${search}%`]);
  
    return result.rows;
  };



  export const updateCustomer = async ({
    customer_id,
    name,
    mobile,
    address,
    notes,
  }) => {
    const query = `
      UPDATE customers
      SET
        name = $1,
        mobile = $2,
        address = $3,
        notes = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = $5
        AND is_deleted = FALSE
      RETURNING *;
    `;
  
    const values = [name, mobile, address, notes, customer_id];
  
    const result = await pool.query(query, values);
  
    return result.rows[0];
  };



  export const deleteCustomer = async (customer_id) => {
    const query = `
      UPDATE customers
      SET
        is_deleted = TRUE,
        updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = $1
        AND is_deleted = FALSE
      RETURNING *;
    `;
  
    const result = await pool.query(query, [customer_id]);
  
    return result.rows[0];
  };





