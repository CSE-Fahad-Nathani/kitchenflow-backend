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

export const getMonthlyStatistics = async (month, year) => {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;

  const nextMonth =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const statistics = {};

  const revenueQuery = `
    SELECT
      COUNT(*) AS total_orders,

      COALESCE(SUM(total_amount), 0) AS total_revenue,

      COALESCE(SUM(discount), 0) AS total_discount,

      COALESCE(SUM(delivery_charge), 0) AS total_delivery,

      COALESCE(AVG(total_amount), 0) AS average_bill,

      COALESCE(MAX(total_amount), 0) AS highest_bill,

      COALESCE(MIN(total_amount), 0) AS lowest_bill

    FROM orders

    WHERE
      is_deleted = FALSE
      AND delivery_datetime >= $1
      AND delivery_datetime < $2;
  `;

  const revenueResult = await pool.query(revenueQuery, [
    startDate,
    nextMonth,
  ]);

  statistics.revenue = revenueResult.rows[0];

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

const dailyRevenueQuery = `
SELECT
    DATE(delivery_datetime) AS date,

    COUNT(*) AS total_orders,

    SUM(total_amount) AS total_revenue

FROM orders

WHERE
    is_deleted = FALSE
    AND delivery_datetime >= $1
    AND delivery_datetime < $2

GROUP BY
    DATE(delivery_datetime)

ORDER BY
    DATE(delivery_datetime);
`;

const dailyRevenueResult = await pool.query(dailyRevenueQuery, [
  startDate,
  nextMonth,
]);

statistics.daily_revenue = dailyRevenueResult.rows;

const weeklyRevenueQuery = `
SELECT
    CEIL(EXTRACT(DAY FROM delivery_datetime) / 7.0) AS week,

    COUNT(*) AS total_orders,

    SUM(total_amount) AS total_revenue

FROM orders

WHERE
    is_deleted = FALSE
    AND delivery_datetime >= $1
    AND delivery_datetime < $2

GROUP BY
    week

ORDER BY
    week;
`;

const weeklyRevenueResult = await pool.query(weeklyRevenueQuery, [
  startDate,
  nextMonth,
]);

statistics.weekly_revenue = weeklyRevenueResult.rows;


const bestDayQuery = `
SELECT
    DATE(delivery_datetime) AS date,

    COUNT(*) AS total_orders,

    SUM(total_amount) AS total_revenue

FROM orders

WHERE
    is_deleted = FALSE
    AND delivery_datetime >= $1
    AND delivery_datetime < $2

GROUP BY
    DATE(delivery_datetime)

ORDER BY
    total_revenue DESC

LIMIT 1;
`;

const bestDayResult = await pool.query(bestDayQuery, [
  startDate,
  nextMonth,
]);

statistics.best_day = bestDayResult.rows[0] || null;

const monthlyTiffinQuery = `
SELECT
    COUNT(*) AS total_bills,

    COALESCE(SUM(total_amount), 0) AS total_revenue,

    COALESCE(AVG(total_amount), 0) AS average_bill

FROM monthly_tiffin_bills

WHERE
    is_deleted = FALSE
    AND created_at >= $1
    AND created_at < $2;
`;

const monthlyTiffinResult = await pool.query(
  monthlyTiffinQuery,
  [startDate, nextMonth]
);

statistics.monthly_tiffin =
  monthlyTiffinResult.rows[0];

  const datewiseBillQuery = `
SELECT
    COUNT(*) AS total_bills,

    COALESCE(SUM(total_amount), 0) AS total_revenue,

    COALESCE(AVG(total_amount), 0) AS average_bill

FROM datewise_bills

WHERE
    is_deleted = FALSE
    AND created_at >= $1
    AND created_at < $2;
`;

const datewiseBillResult = await pool.query(
  datewiseBillQuery,
  [startDate, nextMonth]
);

statistics.datewise_bills =
  datewiseBillResult.rows[0];

 
  const sundayRevenueQuery = `
  SELECT
      DATE(delivery_datetime) AS date,
  
      COUNT(*) AS total_orders,
  
      SUM(total_amount) AS revenue
  
  FROM orders
  
  WHERE
      is_deleted = FALSE
      AND EXTRACT(DOW FROM delivery_datetime) = 0
      AND delivery_datetime >= $1
      AND delivery_datetime < $2
  
  GROUP BY
      DATE(delivery_datetime)
  
  ORDER BY
      DATE(delivery_datetime);
  `;
  
  const sundayRevenueResult = await pool.query(
    sundayRevenueQuery,
    [startDate, nextMonth]
  );
  
  const sundayDays = sundayRevenueResult.rows;
  
  const totalSundayRevenue = sundayDays.reduce(
    (sum, day) => sum + Number(day.revenue),
    0
  );
  
  const bestSunday =
    sundayDays.length > 0
      ? sundayDays.reduce((best, current) =>
          Number(current.revenue) > Number(best.revenue)
            ? current
            : best
        )
      : null;
  
  statistics.sunday_revenue = {
    total_sundays: sundayDays.length,
  
    total_revenue: totalSundayRevenue,
  
    average_revenue:
      sundayDays.length > 0
        ? Number(
            (totalSundayRevenue / sundayDays.length).toFixed(2)
          )
        : 0,
  
    best_sunday: bestSunday,
  
    days: sundayDays,
  };






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


  const previousStartDate =
  month === 1
    ? `${year - 1}-12-01`
    : `${year}-${String(month - 1).padStart(2, "0")}-01`;

const previousEndDate = startDate;

const growthQuery = `
SELECT
    COUNT(*) AS total_orders,

    COALESCE(SUM(total_amount), 0) AS total_revenue,

    COALESCE(AVG(total_amount), 0) AS average_bill

FROM orders

WHERE
    is_deleted = FALSE
    AND delivery_datetime >= $1
    AND delivery_datetime < $2;
`;

const previousResult = await pool.query(growthQuery, [
  previousStartDate,
  previousEndDate,
]);

const previous = previousResult.rows[0];
const current = statistics.revenue;

const calculateGrowth = (currentValue, previousValue) => {
  currentValue = Number(currentValue);
  previousValue = Number(previousValue);

  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }

  return Number(
    (((currentValue - previousValue) / previousValue) * 100).toFixed(2)
  );
};

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