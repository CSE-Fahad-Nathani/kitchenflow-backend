import express from "express";
import {
  createMonthlyTiffinBillHandler,
  fetchMonthlyTiffinBills,
  fetchMonthlyTiffinBillById,
  removeMonthlyTiffinBill,
} from "../controllers/monthlyTiffinController.js";

const router = express.Router();

router.post("/create", createMonthlyTiffinBillHandler);

router.get("/", fetchMonthlyTiffinBills);

router.get("/:bill_id", fetchMonthlyTiffinBillById);

router.delete("/delete", removeMonthlyTiffinBill);

export default router;