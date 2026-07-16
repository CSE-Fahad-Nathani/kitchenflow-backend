import { getDashboardStatistics, getMonthlyStatistics } from "../services/dashboardService.js";

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


export const fetchMonthlyStatistics = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "month and year are required.",
      });
    }

    const statistics = await getMonthlyStatistics(
      Number(month),
      Number(year)
    );

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


