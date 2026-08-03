import express from "express";
import {
  createOrder,
  fetchOrders,
  fetchTodaysOrders,
  fetchOrderById,
  updateOrderPaymentStatus,
  editOrder,
  removeOrder,
  updateReminderCount,
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/add-order", createOrder);

router.get("/fetch-orders", fetchOrders);

router.get("/fetch-todays-orders", fetchTodaysOrders);

router.get("/:order_id", fetchOrderById);

router.patch("/mark-paid", updateOrderPaymentStatus);

router.put("/update-order", editOrder);

router.patch("/increase-reminder", updateReminderCount);

router.delete("/delete-order", removeOrder);

export default router;