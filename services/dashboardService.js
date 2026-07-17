import pool from "../database/db.js";
import {
  getMonthRange,
  buildRevenueMetrics,
  calculateGrowth,
  summarizeTiffinForMonth,
  summarizeDatewiseForMonth,
} from "./dashboardRevenueHelpers.js";

const fetchRevenueSourceData = async (rangeStart, rangeEnd) => {
  const ordersQuery = `
    SELECT
      delivery_datetime,
      total_amount,
      discount,
      delivery_charge
    FROM orders
    WHERE
      is_deleted = FALSE
      AND delivery_datetime >= $1
      AND delivery_datetime < $2;
  `;

  const tiffinQuery = `
    SELECT
      b.bill_id,
      b.from_date,
      b.to_date,
      b.rate_per_day,
      b.quantity,
      b.delivery_charge,
      b.discount,
      b.total_amount,
      COALESCE(
        (
          SELECT json_agg(e.excluded_date)
          FROM monthly_tiffin_excluded_dates e
          WHERE e.bill_id = b.bill_id
        ),
        '[]'
      ) AS excluded_dates
    FROM monthly_tiffin_bills b
    WHERE
      b.is_deleted = FALSE
      AND b.from_date < $2::date
      AND b.to_date >= $1::date;
  `;

  const datewiseQuery = `
    SELECT
      b.bill_id,
      b.discount,
      b.total_amount,
      COALESCE(
        (
          SELECT json_agg(day_data ORDER BY (day_data->>'bill_date'))
          FROM (
            SELECT json_build_object(
              'day_id', d.day_id,
              'bill_date', d.bill_date,
              'delivery_charge', d.delivery_charge,
              'items', (
                SELECT COALESCE(
                  json_agg(
                    json_build_object(
                      'quantity', i.quantity,
                      'price', i.price
                    )
                  ),
                  '[]'
                )
                FROM datewise_bill_items i
                WHERE i.day_id = d.day_id
              )
            ) AS day_data
            FROM datewise_bill_days d
            WHERE d.bill_id = b.bill_id
          ) sub
        ),
        '[]'
      ) AS days
    FROM datewise_bills b
    WHERE
      b.is_deleted = FALSE
      AND EXISTS (
        SELECT 1
        FROM datewise_bill_days d
        WHERE
          d.bill_id = b.bill_id
          AND d.bill_date >= $1::date
          AND d.bill_date < $2::date
      );
  `;

  const [ordersResult, tiffinResult, datewiseResult] = await Promise.all([
    pool.query(ordersQuery, [rangeStart, rangeEnd]),
    pool.query(tiffinQuery, [rangeStart, rangeEnd]),
    pool.query(datewiseQuery, [rangeStart, rangeEnd]),
  ]);

  return {
    orders: ordersResult.rows,
    tiffinBills: tiffinResult.rows,
    datewiseBills: datewiseResult.rows,
  };
};

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

export const getMonthlyStatistics = async (month, year) => {
  const { startDate, nextMonth, previousStartDate } = getMonthRange(month, year);
  const previousMonth = month === 1 ? 12 : month - 1;

  const statistics = {};

  const sourceData = await fetchRevenueSourceData(previousStartDate, nextMonth);

  const currentMetrics = buildRevenueMetrics({
    ...sourceData,
    startDate,
    nextMonth,
    month,
  });

  statistics.revenue = currentMetrics.revenue;
  statistics.daily_revenue = currentMetrics.daily_revenue;
  statistics.weekly_revenue = currentMetrics.weekly_revenue;
  statistics.best_day = currentMetrics.best_day;
  statistics.sunday_revenue = currentMetrics.sunday_revenue;

  const orderSummaryQuery = `
SELECT
(
    SELECT COUNT(*)
    FROM orders
    WHERE
        is_deleted = FALSE
        AND delivery_datetime >= $1
        AND delivery_datetime < $2
) AS standard_orders,

(
    SELECT COUNT(*)
    FROM monthly_tiffin_bills
    WHERE
        is_deleted = FALSE
        AND created_at >= $1
        AND created_at < $2
) AS monthly_tiffin_orders,

(
    SELECT COUNT(*)
    FROM datewise_bills
    WHERE
        is_deleted = FALSE
        AND created_at >= $1
        AND created_at < $2
) AS datewise_orders;
`;

const orderSummaryResult = await pool.query(orderSummaryQuery, [
  startDate,
  nextMonth,
]);

statistics.orders = orderSummaryResult.rows[0];

const customerQuery = `
SELECT
    COUNT(*) AS total_customers,

    COUNT(*) FILTER (
        WHERE
            created_at >= $1
            AND created_at < $2
    ) AS new_customers,

    (
        SELECT COUNT(DISTINCT customer_id)
        FROM orders
        WHERE
            is_deleted = FALSE
            AND delivery_datetime >= $1
            AND delivery_datetime < $2
            AND customer_id IS NOT NULL
    ) AS active_customers

FROM customers

WHERE
    is_deleted = FALSE;
`;

const customerResult = await pool.query(customerQuery, [
  startDate,
  nextMonth,
]);

statistics.customers = customerResult.rows[0];

const topCustomersQuery = `
SELECT
    customer_name,
    customer_mobile,

    COUNT(*) AS total_orders,

    SUM(total_amount) AS total_spent

FROM orders

WHERE
    is_deleted = FALSE
    AND delivery_datetime >= $1
    AND delivery_datetime < $2

GROUP BY
    customer_name,
    customer_mobile

ORDER BY
    total_spent DESC

LIMIT 10;
`;

const topCustomersResult = await pool.query(topCustomersQuery, [
  startDate,
  nextMonth,
]);

statistics.top_customers = topCustomersResult.rows;

const topDishesQuery = `
SELECT
    dish_name,

    COUNT(*) AS times_ordered,

    SUM(quantity) AS total_quantity,

    SUM(total_price) AS total_revenue

FROM order_items

WHERE
    created_at >= $1
    AND created_at < $2

GROUP BY
    dish_name

ORDER BY
    total_quantity DESC,
    total_revenue DESC

LIMIT 10;
`;

const topDishesResult = await pool.query(topDishesQuery, [
  startDate,
  nextMonth,
]);

statistics.top_dishes = topDishesResult.rows;

  statistics.monthly_tiffin = summarizeTiffinForMonth(
    sourceData.tiffinBills,
    startDate,
    nextMonth
  );

  statistics.datewise_bills = summarizeDatewiseForMonth(
    sourceData.datewiseBills,
    startDate,
    nextMonth
  );

  const highestBillsQuery = `
SELECT
    order_id,

    customer_name,

    customer_mobile,

    total_amount,

    delivery_datetime

FROM orders

WHERE
    is_deleted = FALSE
    AND delivery_datetime >= $1
    AND delivery_datetime < $2

ORDER BY
    total_amount DESC

LIMIT 5;
`;

const highestBillsResult = await pool.query(
  highestBillsQuery,
  [startDate, nextMonth]
);

statistics.highest_bills =
  highestBillsResult.rows;

  const previousMetrics = buildRevenueMetrics({
    ...sourceData,
    startDate: previousStartDate,
    nextMonth: startDate,
    month: previousMonth,
  });

  const current = statistics.revenue;
  const previous = previousMetrics.revenue;

  statistics.growth = {
    revenue_growth: calculateGrowth(
      current.total_revenue,
      previous.total_revenue
    ),

    order_growth: calculateGrowth(
      current.total_orders,
      previous.total_orders
    ),

    average_bill_growth: calculateGrowth(
      current.average_bill,
      previous.average_bill
    ),
  };

  return statistics;
};