import {
    createDatewiseBill,
    getDatewiseBills,
    getDatewiseBillById,
    deleteDatewiseBill,
    markDatewiseBillPaid,
    increaseDatewiseBillReminder,
  } from "../services/datewiseBillService.js";



  export const createDatewiseBillHandler = async (req, res) => {
    try {
      const {
        customer_name,
        total_amount,
        days,
      } = req.body;
  
      if (
        !customer_name ||
        !total_amount ||
        !Array.isArray(days) ||
        days.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }
  
      const bill = await createDatewiseBill(req.body);
  
      res.status(201).json({
        success: true,
        message: "Date-wise Bill created successfully.",
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


  export const fetchDatewiseBills = async (req, res) => {
    try {
      const { search = "" } = req.query;
  
      const bills = await getDatewiseBills(search);
  
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


  export const fetchDatewiseBillById = async (req, res) => {
    try {
      const { bill_id } = req.params;
  
      const bill = await getDatewiseBillById(bill_id);
  
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

  export const removeDatewiseBill = async (req, res) => {
    try {
      const { bill_id } = req.body;
  
      if (!bill_id) {
        return res.status(400).json({
          success: false,
          message: "bill_id is required",
        });
      }
  
      const bill = await deleteDatewiseBill(bill_id);
  
      res.json({
        success: true,
        message: "Date-wise Bill deleted successfully.",
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


  export const updateDatewiseBillPaymentStatus = async (req, res) => {
    try {
      const { bill_id } = req.body;

      if (!bill_id) {
        return res.status(400).json({
          success: false,
          message: "bill_id is required",
        });
      }

      const bill = await markDatewiseBillPaid(bill_id);

      res.json({
        success: true,
        message: "Bill marked as paid.",
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

  export const updateDatewiseBillReminderCount = async (req, res) => {
    try {
      const { bill_id } = req.body;

      if (!bill_id) {
        return res.status(400).json({
          success: false,
          message: "bill_id is required",
        });
      }

      const bill = await increaseDatewiseBillReminder(bill_id);

      res.json({
        success: true,
        message: "Reminder count updated.",
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

