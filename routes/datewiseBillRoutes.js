import express from "express";
import {
  createDatewiseBillHandler,
  fetchDatewiseBills,
  fetchDatewiseBillById,
  removeDatewiseBill,
  updateDatewiseBillPaymentStatus,
  updateDatewiseBillReminderCount,
} from "../controllers/datewiseBillController.js";

const router = express.Router();

router.post("/create", createDatewiseBillHandler);

router.get("/", fetchDatewiseBills);

router.patch("/mark-paid", updateDatewiseBillPaymentStatus);

router.patch("/increase-reminder", updateDatewiseBillReminderCount);

router.get("/:bill_id", fetchDatewiseBillById);

router.delete("/delete", removeDatewiseBill);

export default router;