import express from "express";
import {
  clearOpenCreditsForCustomerHandler,
  createPaidExtraHandler,
  deleteCustomerCreditHandler,
  fetchCustomerCreditByIdHandler,
  fetchCustomerCreditsHandler,
  fetchCustomerCreditStatsHandler,
  fetchOpenCreditsForCustomerHandler,
  updateCustomerCreditHandler,
} from "../controllers/customerCreditController.js";

const router = express.Router();

router.get("/stats", fetchCustomerCreditStatsHandler);
router.get("/", fetchCustomerCreditsHandler);
router.get(
  "/by-customer/:customer_id",
  fetchOpenCreditsForCustomerHandler
);
router.delete(
  "/by-customer/:customer_id",
  clearOpenCreditsForCustomerHandler
);
router.get("/:credit_id", fetchCustomerCreditByIdHandler);
router.post("/paid-extra", createPaidExtraHandler);
router.put("/:credit_id", updateCustomerCreditHandler);
router.delete("/:credit_id", deleteCustomerCreditHandler);

export default router;
