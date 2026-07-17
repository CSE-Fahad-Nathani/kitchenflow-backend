import express from "express";
import {
  createMonthlyTiffinBillHandler,
  fetchMonthlyTiffinBills,
  fetchMonthlyTiffinBillById,
  removeMonthlyTiffinBill,
  updateMonthlyTiffinPaymentStatus,
  updateMonthlyTiffinReminderCount,
} from "../controllers/monthlyTiffinController.js";

const router = express.Router();

router.post("/create", createMonthlyTiffinBillHandler);

router.get("/", fetchMonthlyTiffinBills);

router.patch("/mark-paid", updateMonthlyTiffinPaymentStatus);

router.patch("/increase-reminder", updateMonthlyTiffinReminderCount);

router.get("/:bill_id", fetchMonthlyTiffinBillById);

router.delete("/delete", removeMonthlyTiffinBill);

export default router;