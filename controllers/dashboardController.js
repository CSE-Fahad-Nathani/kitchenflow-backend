import { getDashboardStatistics } from "../services/dashboardService.js";

export const fetchDashboardStatistics = async (req, res) => {
  try {
    const statistics = await getDashboardStatistics();

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};