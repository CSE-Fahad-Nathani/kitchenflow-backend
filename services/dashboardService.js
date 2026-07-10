import pool from "../database/db.js";

export const getDashboardStatistics = async () => {
  const query = `
    SELECT
      COUNT(*) FILTER (
        WHERE
          DATE(delivery_datetime) = CURRENT_DATE
          AND is_deleted = FALSE
      ) AS today_orders,

      COALESCE(
        SUM(total_amount) FILTER (
          WHERE
            DATE(delivery_datetime) = CURRENT_DATE
            AND is_deleted = FALSE
        ),
        0
      ) AS today_revenue,

      COUNT(*) FILTER (
        WHERE
          is_paid = FALSE
          AND DATE(delivery_datetime) = CURRENT_DATE
          AND is_deleted = FALSE
      ) AS pending_orders,

      COALESCE(
        SUM(total_amount) FILTER (
          WHERE
            is_paid = FALSE
            AND DATE(delivery_datetime) = CURRENT_DATE
            AND is_deleted = FALSE
        ),
        0
      ) AS pending_amount

    FROM orders;
  `;

  const result = await pool.query(query);

  return result.rows[0];
};