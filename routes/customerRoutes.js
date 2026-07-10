import express from "express";
import { addCustomer, fetchCustomers, searchCustomer, editCustomer, removeCustomer } from "../controllers/customerController.js";

const router = express.Router();

router.post("/", addCustomer);
router.get("/", fetchCustomers);
router.get("/search-customers", searchCustomer);
router.post("/update-customer", editCustomer);
router.post("/delete-customer", removeCustomer);

export default router;