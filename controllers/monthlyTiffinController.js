import {
    createMonthlyTiffinBill,
    getMonthlyTiffinBills,
    getMonthlyTiffinBillById,
    deleteMonthlyTiffinBill,
  } from "../services/monthlyTiffinService.js";

  export const createMonthlyTiffinBillHandler = async (req, res) => {
    try {
      const {
        from_date,
        to_date,
        customer_name,
        dish_name,
        rate_per_day,
      } = req.body;
  
      if (
        !from_date ||
        !to_date ||
        !customer_name ||
        !dish_name ||
        !rate_per_day
      ) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }
  
      const bill = await createMonthlyTiffinBill(req.body);
  
      res.status(201).json({
        success: true,
        message: "Monthly Tiffin Bill created successfully.",
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


  export const fetchMonthlyTiffinBills = async (req, res) => {
    try {
      const { search = "" } = req.query;
  
      const bills = await getMonthlyTiffinBills(search);
  
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


  export const fetchMonthlyTiffinBillById = async (req, res) => {
    try {
      const { bill_id } = req.params;
  
      const bill = await getMonthlyTiffinBillById(bill_id);
  
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



  export const removeMonthlyTiffinBill = async (req, res) => {
    try {
      const { bill_id } = req.body;
  
      if (!bill_id) {
        return res.status(400).json({
          success: false,
          message: "bill_id is required",
        });
      }
  
      const bill = await deleteMonthlyTiffinBill(bill_id);
  
      res.json({
        success: true,
        message: "Monthly Tiffin Bill deleted successfully.",
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





