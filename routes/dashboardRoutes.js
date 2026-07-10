import express from "express";
import { fetchDashboardStatistics } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/statistics", fetchDashboardStatistics);

export default router;