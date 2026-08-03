import {
  createCalendarBill,
  getCalendarBills,
  getCalendarBillById,
  deleteCalendarBill,
  markCalendarBillPaid,
  increaseCalendarBillReminder,
} from "../services/calendarBillService.js";

export const createCalendarBillHandler = async (req, res) => {
  try {
    const { customer_name, total_amount, dishes } = req.body;

    if (
      !customer_name ||
      total_amount == null ||
      !Array.isArray(dishes) ||
      dishes.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    for (const dish of dishes) {
      if (
        !dish?.dish_name?.trim() ||
        dish.rate_per_day == null ||
        !Array.isArray(dish.dates) ||
        dish.dates.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Each dish needs a name, rate/day, and at least one date",
        });
      }
    }

    const bill = await createCalendarBill(req.body);

    res.status(201).json({
      success: true,
      message: "Calendar Bill created successfully.",
      data: bill,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const fetchCalendarBills = async (req, res) => {
  try {
    const { search = "" } = req.query;
    const bills = await getCalendarBills(search);

    res.json({
      success: true,
      data: bills,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const fetchCalendarBillById = async (req, res) => {
  try {
    const { bill_id } = req.params;
    const bill = await getCalendarBillById(bill_id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }

    res.json({
      success: true,
      data: bill,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const removeCalendarBill = async (req, res) => {
  try {
    const { bill_id } = req.body;

    if (!bill_id) {
      return res.status(400).json({
        success: false,
        message: "bill_id is required",
      });
    }

    const bill = await deleteCalendarBill(bill_id);

    res.json({
      success: true,
      message: "Calendar Bill deleted successfully.",
      data: bill,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCalendarBillPaymentStatus = async (req, res) => {
  try {
    const { bill_id } = req.body;

    if (!bill_id) {
      return res.status(400).json({
        success: false,
        message: "bill_id is required",
      });
    }

    const bill = await markCalendarBillPaid(bill_id);

    res.json({
      success: true,
      message: "Bill marked as paid.",
      data: bill,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCalendarBillReminderCount = async (req, res) => {
  try {
    const { bill_id } = req.body;

    if (!bill_id) {
      return res.status(400).json({
        success: false,
        message: "bill_id is required",
      });
    }

    const bill = await increaseCalendarBillReminder(bill_id);

    res.json({
      success: true,
      message: "Reminder count updated.",
      data: bill,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
