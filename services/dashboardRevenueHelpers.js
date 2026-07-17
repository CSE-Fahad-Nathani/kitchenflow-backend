/**
 * Dashboard revenue helpers — combine Standard Orders, Monthly Tiffin, Date-wise Bills.
 * All daily amounts are attributed to the calendar day/month the service belongs to.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const getMonthRange = (month, year) => {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const previousStartDate =
    month === 1
      ? `${year - 1}-12-01`
      : `${year}-${String(month - 1).padStart(2, "0")}-01`;

  return { startDate, nextMonth, previousStartDate };
};

const parseYmd = (value) => {
  if (!value) return null;
  const s = String(value).slice(0, 10);
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const fmtYmd = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/** Inclusive day count between two YYYY-MM-DD dates. */
export const countDaysInclusive = (fromDate, toDate) => {
  const from = parseYmd(fromDate);
  const to = parseYmd(toDate);
  if (!from || !to || to < from) return 0;
  return Math.floor((to - from) / MS_PER_DAY) + 1;
};

/** Each calendar day in [from, to] inclusive. */
export const eachDayInclusive = (fromDate, toDate, fn) => {
  const from = parseYmd(fromDate);
  const to = parseYmd(toDate);
  if (!from || !to || to < from) return;

  const cur = new Date(from);
  while (cur <= to) {
    fn(fmtYmd(cur));
    cur.setDate(cur.getDate() + 1);
  }
};

const inRange = (dateYmd, startDate, nextMonth) =>
  dateYmd >= startDate && dateYmd < nextMonth;

/** @returns {Map<string, { date: string, total_orders: number, total_revenue: number, total_discount: number, total_delivery: number }>} */
export const createDailyMap = () => new Map();

export const addDailyEntry = (map, date, { orders = 0, revenue = 0, discount = 0, delivery = 0 }) => {
  if (!date) return;
  const key = String(date).slice(0, 10);
  if (!map.has(key)) {
    map.set(key, {
      date: key,
      total_orders: 0,
      total_revenue: 0,
      total_discount: 0,
      total_delivery: 0,
    });
  }
  const row = map.get(key);
  row.total_orders += orders;
  row.total_revenue += revenue;
  row.total_discount += discount;
  row.total_delivery += delivery;
};

export const dailyMapToRows = (map) =>
  [...map.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({
      date: row.date,
      total_orders: String(row.total_orders),
      total_revenue: Number(row.total_revenue).toFixed(2),
    }));

export const dailyMapToWeeklyRows = (map, month) => {
  const weekTotals = new Map();

  for (const row of map.values()) {
    const d = parseYmd(row.date);
    if (!d || d.getMonth() + 1 !== month) continue;
    const week = Math.ceil(d.getDate() / 7);
    if (!weekTotals.has(week)) {
      weekTotals.set(week, { week: String(week), total_orders: 0, total_revenue: 0 });
    }
    const w = weekTotals.get(week);
    w.total_orders += row.total_orders;
    w.total_revenue += row.total_revenue;
  }

  return [...weekTotals.values()]
    .sort((a, b) => Number(a.week) - Number(b.week))
    .map((row) => ({
      week: row.week,
      total_orders: String(row.total_orders),
      total_revenue: Number(row.total_revenue).toFixed(2),
    }));
};

export const findBestDayFromMap = (map) => {
  let best = null;
  for (const row of map.values()) {
    if (!best || row.total_revenue > best.total_revenue) {
      best = row;
    }
  }
  if (!best) return null;
  return {
    date: best.date,
    total_orders: String(best.total_orders),
    total_revenue: Number(best.total_revenue).toFixed(2),
  };
};

export const aggregateOverviewFromMap = (map, billAmounts = [], totalOrdersOverride = null) => {
  let totalOrdersFromMap = 0;
  let totalRevenue = 0;
  let totalDiscount = 0;
  let totalDelivery = 0;

  for (const row of map.values()) {
    totalOrdersFromMap += row.total_orders;
    totalRevenue += row.total_revenue;
    totalDiscount += row.total_discount;
    totalDelivery += row.total_delivery;
  }

  const totalOrders =
    totalOrdersOverride != null ? totalOrdersOverride : totalOrdersFromMap;

  const allAmounts = billAmounts.map(Number).filter((n) => n > 0);
  const highestBill = allAmounts.length ? Math.max(...allAmounts) : 0;
  const lowestBill = allAmounts.length ? Math.min(...allAmounts) : 0;
  const averageBill = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    total_orders: String(totalOrders),
    total_revenue: Number(totalRevenue).toFixed(2),
    total_discount: Number(totalDiscount).toFixed(2),
    total_delivery: Number(totalDelivery).toFixed(2),
    average_bill: String(averageBill),
    highest_bill: Number(highestBill).toFixed(2),
    lowest_bill: Number(lowestBill).toFixed(2),
  };
};

export const calculateGrowth = (currentValue, previousValue) => {
  const cur = Number(currentValue);
  const prev = Number(previousValue);
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Number((((cur - prev) / prev) * 100).toFixed(2));
};

/** Standard orders → daily map + bill amounts for min/max. */
export const applyStandardOrdersToDaily = (orders, map, startDate, nextMonth) => {
  const billAmounts = [];

  for (const order of orders) {
    const raw = order.delivery_datetime;
    const date =
      raw instanceof Date
        ? fmtYmd(raw)
        : String(raw).slice(0, 10).replace(" ", "T").split("T")[0];

    if (!inRange(date, startDate, nextMonth)) continue;

    const amount = Number(order.total_amount) || 0;
    billAmounts.push(amount);

    addDailyEntry(map, date, {
      orders: 1,
      revenue: amount,
      discount: Number(order.discount) || 0,
      delivery: Number(order.delivery_charge) || 0,
    });
  }

  return billAmounts;
};

/**
 * Monthly tiffin: split across billable service days in range.
 * Daily = rate×qty + delivery/day − discount/billable_days
 */
export const applyMonthlyTiffinToDaily = (bills, map, startDate, nextMonth) => {
  const billAmounts = [];

  for (const bill of bills) {
    const excluded = new Set(
      (bill.excluded_dates || [])
        .map((e) => (typeof e === "string" ? e : e?.excluded_date))
        .filter(Boolean)
        .map((d) => String(d).slice(0, 10))
    );

    const billableDaysList = [];
    eachDayInclusive(bill.from_date, bill.to_date, (day) => {
      if (!excluded.has(day)) billableDaysList.push(day);
    });

    const billableDays = billableDaysList.length;
    if (billableDays === 0) continue;

    const rate = Number(bill.rate_per_day) || 0;
    const qty = Math.max(1, Number(bill.quantity) || 1);
    const deliveryPerDay = Number(bill.delivery_charge) || 0;
    const discount = Number(bill.discount) || 0;
    const discountPerDay = discount / billableDays;
    const dailyRevenue = rate * qty + deliveryPerDay - discountPerDay;

    const daysInMonth = billableDaysList.filter((d) =>
      inRange(d, startDate, nextMonth)
    );

    if (daysInMonth.length > 0) {
      billAmounts.push(Number(bill.total_amount) || 0);
    }

    for (const day of daysInMonth) {
      addDailyEntry(map, day, {
        orders: 0,
        revenue: dailyRevenue,
        discount: discountPerDay,
        delivery: deliveryPerDay,
      });
    }
  }

  return billAmounts;
};

/**
 * Date-wise: each bill_date gets items + delivery − proportional discount.
 */
export const applyDatewiseToDaily = (bills, map, startDate, nextMonth) => {
  const billAmounts = [];

  for (const bill of bills) {
    const days = bill.days || [];
    if (days.length === 0) continue;

    const daySubtotals = days.map((day) => {
      const itemsTotal = (day.items || []).reduce((sum, item) => {
        const qty = Number(item.quantity) || 1;
        const rate = Number(item.price) || 0;
        return sum + qty * rate;
      }, 0);
      const delivery = Number(day.delivery_charge) || 0;
      return itemsTotal + delivery;
    });

    const billSubtotal = daySubtotals.reduce((a, b) => a + b, 0);
    const billDiscount = Number(bill.discount) || 0;

    let hasDayInMonth = false;

    days.forEach((day, index) => {
      const date = String(day.bill_date).slice(0, 10);
      if (!inRange(date, startDate, nextMonth)) return;

      hasDayInMonth = true;
      const daySubtotal = daySubtotals[index];
      const dayDiscount =
        billSubtotal > 0 ? (billDiscount * daySubtotal) / billSubtotal : 0;
      const dayRevenue = daySubtotal - dayDiscount;

      addDailyEntry(map, date, {
        orders: 1,
        revenue: dayRevenue,
        discount: dayDiscount,
        delivery: Number(day.delivery_charge) || 0,
      });
    });

    if (hasDayInMonth) {
      billAmounts.push(Number(bill.total_amount) || 0);
    }
  }

  return billAmounts;
};

/** Sunday slice from merged daily map (date string → revenue). */
export const buildSundayRevenueFromMap = (map, startDate, nextMonth) => {
  const days = [];

  for (const row of map.values()) {
    if (!inRange(row.date, startDate, nextMonth)) continue;
    const d = parseYmd(row.date);
    if (!d || d.getDay() !== 0) continue;
    days.push({
      date: row.date,
      total_orders: row.total_orders,
      revenue: row.total_revenue,
    });
  }

  const totalSundayRevenue = days.reduce((s, d) => s + Number(d.revenue), 0);
  const bestSunday =
    days.length > 0
      ? days.reduce((best, cur) =>
          Number(cur.revenue) > Number(best.revenue) ? cur : best
        )
      : null;

  return {
    total_sundays: days.length,
    total_revenue: totalSundayRevenue,
    average_revenue:
      days.length > 0
        ? Number((totalSundayRevenue / days.length).toFixed(2))
        : 0,
    best_sunday: bestSunday
      ? {
          date: bestSunday.date,
          total_orders: String(bestSunday.total_orders),
          revenue: Number(bestSunday.revenue).toFixed(2),
        }
      : null,
    days: days.map((d) => ({
      date: d.date,
      total_orders: String(d.total_orders),
      revenue: Number(d.revenue).toFixed(2),
    })),
  };
};

/** Count tiffin bills with any billable day in the month. */
export const countTiffinBillsInMonth = (bills, startDate, nextMonth) => {
  let count = 0;
  for (const bill of bills) {
    const excluded = new Set(
      (bill.excluded_dates || [])
        .map((e) => (typeof e === "string" ? e : e?.excluded_date))
        .filter(Boolean)
        .map((d) => String(d).slice(0, 10))
    );
    let found = false;
    eachDayInclusive(bill.from_date, bill.to_date, (day) => {
      if (found) return;
      if (excluded.has(day)) return;
      if (inRange(day, startDate, nextMonth)) found = true;
    });
    if (found) count += 1;
  }
  return count;
};

/** Count datewise bills with at least one day in the month. */
export const countDatewiseBillsInMonth = (bills, startDate, nextMonth) => {
  let count = 0;
  for (const bill of bills) {
    const has = (bill.days || []).some((day) =>
      inRange(String(day.bill_date).slice(0, 10), startDate, nextMonth)
    );
    if (has) count += 1;
  }
  return count;
};

export const countStandardOrdersInMonth = (orders, startDate, nextMonth) => {
  return orders.filter((o) => {
    const raw = o.delivery_datetime;
    const date =
      raw instanceof Date
        ? fmtYmd(raw)
        : String(raw).slice(0, 10).replace(" ", "T").split("T")[0];
    return inRange(date, startDate, nextMonth);
  }).length;
};

export const sumMapRevenue = (map) =>
  [...map.values()].reduce((s, row) => s + row.total_revenue, 0);

const formatBreakdownItem = (count, revenue) => ({
  count: String(count),
  revenue: Number(revenue).toFixed(2),
});

/** Standard orders — revenue for delivery dates in the month. */
export const summarizeStandardForMonth = (orders, startDate, nextMonth) => {
  const map = createDailyMap();
  applyStandardOrdersToDaily(orders, map, startDate, nextMonth);
  const count = countStandardOrdersInMonth(orders, startDate, nextMonth);
  return formatBreakdownItem(count, sumMapRevenue(map));
};

const formatModuleStats = (totalBills, totalRevenue) => ({
  total_bills: String(totalBills),
  total_revenue: Number(totalRevenue).toFixed(2),
  average_bill:
    totalBills > 0
      ? String(Number((totalRevenue / totalBills).toFixed(2)))
      : "0",
});

/** Monthly tiffin block — revenue only for service days in the month. */
export const summarizeTiffinForMonth = (bills, startDate, nextMonth) => {
  const map = createDailyMap();
  applyMonthlyTiffinToDaily(bills, map, startDate, nextMonth);
  const totalBills = countTiffinBillsInMonth(bills, startDate, nextMonth);
  return formatModuleStats(totalBills, sumMapRevenue(map));
};

/** Date-wise block — revenue only for bill dates in the month. */
export const summarizeDatewiseForMonth = (bills, startDate, nextMonth) => {
  const map = createDailyMap();
  applyDatewiseToDaily(bills, map, startDate, nextMonth);
  const totalBills = countDatewiseBillsInMonth(bills, startDate, nextMonth);
  return formatModuleStats(totalBills, sumMapRevenue(map));
};

/** Build all merged revenue metrics for one calendar month. */
export const buildRevenueMetrics = ({
  orders = [],
  tiffinBills = [],
  datewiseBills = [],
  startDate,
  nextMonth,
  month,
}) => {
  const map = createDailyMap();
  const billAmounts = [
    ...applyStandardOrdersToDaily(orders, map, startDate, nextMonth),
    ...applyMonthlyTiffinToDaily(tiffinBills, map, startDate, nextMonth),
    ...applyDatewiseToDaily(datewiseBills, map, startDate, nextMonth),
  ];

  const totalOrders =
    countStandardOrdersInMonth(orders, startDate, nextMonth) +
    countTiffinBillsInMonth(tiffinBills, startDate, nextMonth) +
    countDatewiseBillsInMonth(datewiseBills, startDate, nextMonth);

  const standardBreakdown = summarizeStandardForMonth(
    orders,
    startDate,
    nextMonth
  );
  const tiffinBreakdown = summarizeTiffinForMonth(
    tiffinBills,
    startDate,
    nextMonth
  );
  const datewiseBreakdown = summarizeDatewiseForMonth(
    datewiseBills,
    startDate,
    nextMonth
  );

  return {
    revenue: {
      ...aggregateOverviewFromMap(map, billAmounts, totalOrders),
      by_type: {
        standard_orders: standardBreakdown,
        monthly_tiffin: formatBreakdownItem(
          tiffinBreakdown.total_bills,
          tiffinBreakdown.total_revenue
        ),
        datewise_bills: formatBreakdownItem(
          datewiseBreakdown.total_bills,
          datewiseBreakdown.total_revenue
        ),
      },
    },
    daily_revenue: dailyMapToRows(map),
    weekly_revenue: dailyMapToWeeklyRows(map, month),
    best_day: findBestDayFromMap(map),
    sunday_revenue: buildSundayRevenueFromMap(map, startDate, nextMonth),
  };
};
