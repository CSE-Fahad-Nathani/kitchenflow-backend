import pool from "../database/db.js";

const BILL_TYPES = new Set([
  "standard",
  "monthly_tiffin",
  "datewise",
  "calendar",
]);

const markBillPaid = async (client, bill_type, bill_id) => {
  if (bill_type === "standard") {
    const result = await client.query(
      `
      UPDATE orders
      SET is_paid = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1 AND is_deleted = FALSE
      RETURNING order_id;
      `,
      [bill_id]
    );
    return result.rows[0] || null;
  }

  if (bill_type === "monthly_tiffin") {
    const result = await client.query(
      `
      UPDATE monthly_tiffin_bills
      SET is_paid = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE bill_id = $1 AND is_deleted = FALSE
      RETURNING bill_id;
      `,
      [bill_id]
    );
    return result.rows[0] || null;
  }

  if (bill_type === "datewise") {
    const result = await client.query(
      `
      UPDATE datewise_bills
      SET is_paid = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE bill_id = $1 AND is_deleted = FALSE
      RETURNING bill_id;
      `,
      [bill_id]
    );
    return result.rows[0] || null;
  }

  if (bill_type === "calendar") {
    const result = await client.query(
      `
      UPDATE calendar_bills
      SET is_paid = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE bill_id = $1 AND is_deleted = FALSE
      RETURNING bill_id;
      `,
      [bill_id]
    );
    return result.rows[0] || null;
  }

  return null;
};

export const getCustomerCreditStats = async () => {
  const query = `
    SELECT
      COALESCE(SUM(amount), 0) AS open_credit_total,
      COUNT(*)::int AS open_credit_count,
      COUNT(
        DISTINCT CASE
          WHEN customer_id IS NOT NULL THEN customer_id::text
          ELSE lower(trim(customer_name)) || '|' || coalesce(trim(customer_mobile), '')
        END
      )::int AS open_credit_people,
      COALESCE(
        SUM(amount) FILTER (WHERE DATE(created_at) = CURRENT_DATE),
        0
      ) AS today_extras_total,
      COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)::int AS today_extras_count
    FROM customer_credits;
  `;

  const result = await pool.query(query);
  return result.rows[0];
};

export const getCustomerCredits = async ({ filter = "all", search = "" } = {}) => {
  const params = [];
  const where = [];

  if (filter === "today") {
    where.push(`DATE(c.created_at) = CURRENT_DATE`);
  }

  if (search && String(search).trim()) {
    params.push(`%${String(search).trim()}%`);
    where.push(
      `(c.customer_name ILIKE $${params.length} OR c.customer_mobile ILIKE $${params.length} OR c.note ILIKE $${params.length})`
    );
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const query = `
    SELECT
      c.credit_id,
      c.customer_id,
      c.customer_name,
      c.customer_mobile,
      c.amount,
      c.note,
      c.bill_type,
      c.bill_id,
      c.created_at,
      c.updated_at
    FROM customer_credits c
    ${whereSql}
    ORDER BY c.created_at DESC;
  `;

  const result = await pool.query(query, params);
  return result.rows;
};

export const getCustomerCreditById = async (credit_id) => {
  const result = await pool.query(
    `
    SELECT
      credit_id,
      customer_id,
      customer_name,
      customer_mobile,
      amount,
      note,
      bill_type,
      bill_id,
      created_at,
      updated_at
    FROM customer_credits
    WHERE credit_id = $1;
    `,
    [credit_id]
  );
  return result.rows[0] || null;
};

export const createPaidExtraCredit = async (payload) => {
  const {
    bill_type,
    bill_id,
    amount,
    note,
    customer_id,
    customer_name,
    customer_mobile,
  } = payload;

  if (!BILL_TYPES.has(bill_type)) {
    throw new Error("Invalid bill type");
  }

  const amt = Number(amount);
  if (!(amt > 0)) {
    throw new Error("Extra amount must be greater than 0");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const paid = await markBillPaid(client, bill_type, bill_id);
    if (!paid) {
      throw new Error("Bill not found or already removed");
    }

    const insert = await client.query(
      `
      INSERT INTO customer_credits (
        customer_id,
        customer_name,
        customer_mobile,
        amount,
        note,
        bill_type,
        bill_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING
        credit_id,
        customer_id,
        customer_name,
        customer_mobile,
        amount,
        note,
        bill_type,
        bill_id,
        created_at,
        updated_at;
      `,
      [
        customer_id || null,
        (customer_name || "").trim() || "Customer",
        (customer_mobile || "").trim() || "",
        amt,
        (note || "").trim() || "",
        bill_type,
        bill_id,
      ]
    );

    await client.query("COMMIT");
    return insert.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const updateCustomerCredit = async (credit_id, payload) => {
  const amount =
    payload.amount != null ? Number(payload.amount) : undefined;
  if (amount != null && !(amount > 0)) {
    throw new Error("Amount must be greater than 0");
  }

  const result = await pool.query(
    `
    UPDATE customer_credits
    SET
      amount = COALESCE($2, amount),
      note = COALESCE($3, note),
      customer_name = COALESCE($4, customer_name),
      customer_mobile = COALESCE($5, customer_mobile),
      updated_at = CURRENT_TIMESTAMP
    WHERE credit_id = $1
    RETURNING
      credit_id,
      customer_id,
      customer_name,
      customer_mobile,
      amount,
      note,
      bill_type,
      bill_id,
      created_at,
      updated_at;
    `,
    [
      credit_id,
      amount ?? null,
      payload.note != null ? String(payload.note).trim() : null,
      payload.customer_name != null
        ? String(payload.customer_name).trim()
        : null,
      payload.customer_mobile != null
        ? String(payload.customer_mobile).trim()
        : null,
    ]
  );

  return result.rows[0] || null;
};

export const deleteCustomerCredit = async (credit_id) => {
  const result = await pool.query(
    `
    DELETE FROM customer_credits
    WHERE credit_id = $1
    RETURNING credit_id, customer_name, amount;
    `,
    [credit_id]
  );
  return result.rows[0] || null;
};

export const getOpenCreditsForCustomer = async ({
  customer_id,
  customer_name = "",
} = {}) => {
  if (!customer_id) {
    return { total: 0, count: 0, credits: [] };
  }

  const name = String(customer_name || "").trim();
  const result = await pool.query(
    `
    SELECT
      credit_id,
      customer_id,
      customer_name,
      customer_mobile,
      amount,
      note,
      bill_type,
      bill_id,
      created_at,
      updated_at
    FROM customer_credits
    WHERE customer_id = $1
       OR (
         customer_id IS NULL
         AND $2 <> ''
         AND lower(trim(customer_name)) = lower($2)
       )
    ORDER BY created_at DESC;
    `,
    [customer_id, name]
  );

  const credits = result.rows;
  const total = credits.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  return {
    total,
    count: credits.length,
    credits,
  };
};

export const clearOpenCreditsForCustomer = async ({
  customer_id,
  customer_name = "",
} = {}) => {
  if (!customer_id) {
    throw new Error("customer_id is required");
  }

  const name = String(customer_name || "").trim();
  const result = await pool.query(
    `
    DELETE FROM customer_credits
    WHERE customer_id = $1
       OR (
         customer_id IS NULL
         AND $2 <> ''
         AND lower(trim(customer_name)) = lower($2)
       )
    RETURNING credit_id, amount;
    `,
    [customer_id, name]
  );

  const cleared = result.rows;
  const total = cleared.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  return {
    total,
    count: cleared.length,
    credit_ids: cleared.map((row) => row.credit_id),
  };
};
