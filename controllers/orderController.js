import {
  addOrder,
  getOrders,
  getTodaysOrders,
  markOrderPaid,
  deleteOrder,
  updateOrder,
  increaseReminderCount,
} from "../services/orderService.js";



export const createOrder = async (req, res) => {
  try {
    const { total_amount, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }

    if (!total_amount || Number(total_amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid total amount",
      });
    }

    const order = await addOrder(req.body);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const fetchOrders = async (req, res) => {
    try {
      const orders = await getOrders();
  
      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      console.error(error);
  
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };


  export const fetchTodaysOrders = async (req, res) => {
    try {
      const orders = await getTodaysOrders();
  
      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      console.error(error);
  
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };


  export const updateOrderPaymentStatus = async (req, res) => {
    try {
      const { order_id } = req.body;
  
      if (!order_id) {
        return res.status(400).json({
          success: false,
          message: "order_id is required",
        });
      }
  
      const order = await markOrderPaid(order_id);
  
      res.json({
        success: true,
        message: "Order marked as paid.",
        data: order,
      });
    } catch (error) {
      console.error(error);
  
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };


  export const editOrder = async (req, res) => {
    try {
      const { order_id, items } = req.body;
  
      if (!order_id) {
        return res.status(400).json({
          success: false,
          message: "order_id is required",
        });
      }
  
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one item is required",
        });
      }
  
      const order = await updateOrder(req.body);
  
      res.json({
        success: true,
        message: "Order updated successfully.",
        data: order,
      });
    } catch (error) {
      console.error(error);
  
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  
  export const removeOrder = async (req, res) => {
    try {
      const { order_id } = req.body;
  
      if (!order_id) {
        return res.status(400).json({
          success: false,
          message: "order_id is required",
        });
      }
  
      const order = await deleteOrder(order_id);
  
      res.json({
        success: true,
        message: "Order deleted successfully.",
        data: order,
      });
    } catch (error) {
      console.error(error);
  
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  
  export const updateReminderCount = async (req, res) => {
    try {
      const { order_id } = req.body;
  
      if (!order_id) {
        return res.status(400).json({
          success: false,
          message: "order_id is required",
        });
      }
  
      const order = await increaseReminderCount(order_id);
  
      res.json({
        success: true,
        message: "Reminder count updated.",
        data: order,
      });
    } catch (error) {
      console.error(error);
  
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };


  
  