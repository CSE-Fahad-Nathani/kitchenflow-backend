import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./database/db.js";
import customerRoutes from "./routes/customerRoutes.js";
import dishRoutes from "./routes/dishRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import sundaySpecialRoutes from "./routes/sundaySpecialRoutes.js";
import monthlyTiffinRoutes from "./routes/monthlyTiffinRoutes.js";
import datewiseBillRoutes from "./routes/datewiseBillRoutes.js";
import calendarBillRoutes from "./routes/calendarBillRoutes.js";
import customerCreditRoutes from "./routes/customerCreditRoutes.js";



dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/customers", customerRoutes);
app.use("/api/dishes", dishRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/sunday-specials", sundaySpecialRoutes);
app.use("/api/monthly-tiffin", monthlyTiffinRoutes);
app.use("/api/datewise-bills", datewiseBillRoutes);
app.use("/api/calendar-bills", calendarBillRoutes);
app.use("/api/customer-credits", customerCreditRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "KitchenFlow API Running",
  });
});

app.get("/test-db", async (req, res) => {
    try {
      const result = await pool.query("SELECT NOW()");
  
      res.json({
        success: true,
        message: "Database Connected",
        data: result.rows[0],
      });
    } catch (error) {
      console.error(error);
  
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

