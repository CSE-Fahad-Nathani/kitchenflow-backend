import express from "express";
import {
  createSundaySpecialHandler,
  fetchSundaySpecials,
  fetchSundaySpecialById,
  removeSundaySpecial,
} from "../controllers/sundaySpecialController.js";

const router = express.Router();

router.post("/create", createSundaySpecialHandler);

router.get("/", fetchSundaySpecials);

router.get("/:special_id", fetchSundaySpecialById);

router.delete("/delete", removeSundaySpecial);

export default router;