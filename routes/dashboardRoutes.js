import express from "express";
import { fetchDashboardStatistics, fetchMonthlyStatistics } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/statistics", fetchDashboardStatistics);
router.get("/monthly", fetchMonthlyStatistics);

export default router;