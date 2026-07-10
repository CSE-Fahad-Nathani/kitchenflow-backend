import express from "express";
import { createDish, fetchDishes, searchDish, editDish, removeDish } from "../controllers/dishController.js";

const router = express.Router();

router.post("/add-dish", createDish);
router.get("/fetch-dishes", fetchDishes);
router.get("/search-dishes", searchDish);
router.post("/update-dish", editDish);
router.post("/delete-dish", removeDish);

export default router;