import { createCustomer, getCustomers, searchCustomers, updateCustomer, deleteCustomer } from "../services/customerService.js";

export const addCustomer = async (req, res) => {
  try {
    const { name, mobile, address, notes } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    const customer = await createCustomer({
      name: name.trim(),
      mobile,
      address,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const fetchCustomers = async (req, res) => {
    try {
      const customers = await getCustomers();
  
      res.json({
        success: true,
        data: customers,
      });
    } catch (error) {
      console.error(error);
  
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };


  export const searchCustomer = async (req, res) => {
    try {
      const { q = "" } = req.query;
  
      const customers = await searchCustomers(q.trim());
  
      res.json({
        success: true,
        data: customers,
      });
    } catch (error) {
      console.error(error);
  
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };




  export const editCustomer = async (req, res) => {
    try {
      const { customer_id, name, mobile, address, notes } = req.body;
  
      if (!customer_id || !name?.trim()) {
        return res.status(400).json({
          success: false,
          message: "customer_id and Name are required",
        });
      }
  
      const customer = await updateCustomer({
        customer_id,
        name: name.trim(),
        mobile,
        address,
        notes,
      });
  
      res.json({
        success: true,
        message: "Customer updated successfully",
        data: customer,
      });
    } catch (error) {
      console.error(error);
  
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };




export const removeCustomer = async (req, res) => {
  try {
    const { customer_id } = req.body;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: "Customer customer_id is required",
      });
    }

    const customer = await deleteCustomer(customer_id);

    res.json({
      success: true,
      message: "Customer deleted successfully",
      data: customer,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




