import {
    createSundaySpecial,
    getSundaySpecials,
    getSundaySpecialById,
    deleteSundaySpecial,
  } from "../services/sundaySpecialService.js";


  export const createSundaySpecialHandler = async (req, res) => {
    try {
      const { special_date, items } = req.body;
  
      if (!special_date) {
        return res.status(400).json({
          success: false,
          message: "special_date is required",
        });
      }
  
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one item is required",
        });
      }
  
      const special = await createSundaySpecial(req.body);
  
      res.status(201).json({
        success: true,
        message: "Sunday Special created successfully",
        data: special,
      });
    } catch (error) {
      console.error(error);
  
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };


  export const fetchSundaySpecials = async (req, res) => {
    try {
      const { search = "" } = req.query;
  
      const specials = await getSundaySpecials(search);
  
      res.json({
        success: true,
        data: specials,
      });
    } catch (error) {
      console.error(error);
  
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };



  export const fetchSundaySpecialById = async (req, res) => {
    try {
      const { special_id } = req.params;
  
      const special = await getSundaySpecialById(special_id);
  
      res.json({
        success: true,
        data: special,
      });
    } catch (error) {
      console.error(error);
  
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };


export const removeSundaySpecial = async (req, res) => {
  try {
    const { special_id } = req.body;

    if (!special_id) {
      return res.status(400).json({
        success: false,
        message: "special_id is required",
      });
    }

    const special = await deleteSundaySpecial(special_id);

    res.json({
      success: true,
      message: "Sunday Special deleted successfully.",
      data: special,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};





