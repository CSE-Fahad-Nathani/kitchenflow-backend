import express from "express";
import {
  createCalendarBillHandler,
  fetchCalendarBills,
  fetchCalendarBillById,
  removeCalendarBill,
  updateCalendarBillPaymentStatus,
  updateCalendarBillReminderCount,
} from "../controllers/calendarBillController.js";

const router = express.Router();

router.post("/create", createCalendarBillHandler);

router.get("/", fetchCalendarBills);

router.patch("/mark-paid", updateCalendarBillPaymentStatus);

router.patch("/increase-reminder", updateCalendarBillReminderCount);

router.get("/:bill_id", fetchCalendarBillById);

router.delete("/delete", removeCalendarBill);

export default router;
