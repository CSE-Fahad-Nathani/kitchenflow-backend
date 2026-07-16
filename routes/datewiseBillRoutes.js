import express from "express";
import {
  createDatewiseBillHandler,
  fetchDatewiseBills,
  fetchDatewiseBillById,
  removeDatewiseBill,
} from "../controllers/datewiseBillController.js";

const router = express.Router();

router.post("/create", createDatewiseBillHandler);

router.get("/", fetchDatewiseBills);

router.get("/:bill_id", fetchDatewiseBillById);

router.delete("/delete", removeDatewiseBill);

export default router;