import { addDish, getDishes, searchDishes, updateDish, deleteDish } from "../services/dishService.js";

export const createDish = async (req, res) => {
  try {
    const { dish_name, category, variants } = req.body;

    if (!dish_name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Dish name is required",
      });
    }

    if (!Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one variant is required",
      });
    }

    const dish = await addDish({
      dish_name: dish_name.trim(),
      category,
      variants,
    });

    res.status(201).json({
      success: true,
      message: "Dish created successfully",
      data: dish,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




export const fetchDishes = async (req, res) => {
    try {
      const dishes = await getDishes();
  
      res.json({
        success: true,
        data: dishes,
      });
    } catch (error) {
      console.error(error);
  
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };



  export const searchDish = async (req, res) => {
    try {
      const { q = "" } = req.query;
  
      const dishes = await searchDishes(q.trim());
  
      res.json({
        success: true,
        data: dishes,
      });
    } catch (error) {
      console.error(error);
  
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };



  export const editDish = async (req, res) => {
    try {
      const { dish_id, dish_name, category, variants } = req.body;
  
      if (!dish_id || !dish_name?.trim()) {
        return res.status(400).json({
          success: false,
          message: "dish_id and dish_name are required",
        });
      }
  
      const dish = await updateDish({
        dish_id,
        dish_name: dish_name.trim(),
        category,
        variants,
      });
  
      res.json({
        success: true,
        message: "Dish updated successfully",
        data: dish,
      });
    } catch (error) {
      console.error(error);
  
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };



  export const removeDish = async (req, res) => {
    try {
      const { dish_id } = req.body;
  
      if (!dish_id) {
        return res.status(400).json({
          success: false,
          message: "dish_id is required",
        });
      }
  
      const dish = await deleteDish(dish_id);
  
      res.json({
        success: true,
        message: "Dish deleted successfully",
        data: dish,
      });
    } catch (error) {
      console.error(error);
  
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };