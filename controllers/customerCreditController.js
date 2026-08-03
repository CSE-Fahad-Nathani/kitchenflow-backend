import {
  clearOpenCreditsForCustomer,
  createPaidExtraCredit,
  deleteCustomerCredit,
  getCustomerCreditById,
  getCustomerCredits,
  getCustomerCreditStats,
  getOpenCreditsForCustomer,
  updateCustomerCredit,
} from "../services/customerCreditService.js";

export const fetchCustomerCreditStatsHandler = async (_req, res) => {
  try {
    const data = await getCustomerCreditStats();
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const fetchCustomerCreditsHandler = async (req, res) => {
  try {
    const { filter = "all", search = "" } = req.query;
    const data = await getCustomerCredits({ filter, search });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const fetchCustomerCreditByIdHandler = async (req, res) => {
  try {
    const data = await getCustomerCreditById(req.params.credit_id);
    if (!data) {
      return res.status(404).json({ success: false, message: "Credit not found" });
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPaidExtraHandler = async (req, res) => {
  try {
    const {
      bill_type,
      bill_id,
      amount,
      note,
      customer_id,
      customer_name,
      customer_mobile,
    } = req.body;

    if (!bill_type || !bill_id || amount == null) {
      return res.status(400).json({
        success: false,
        message: "bill_type, bill_id and amount are required",
      });
    }

    const data = await createPaidExtraCredit({
      bill_type,
      bill_id,
      amount,
      note,
      customer_id,
      customer_name,
      customer_mobile,
    });

    res.status(201).json({
      success: true,
      message: "Marked paid and credit saved.",
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCustomerCreditHandler = async (req, res) => {
  try {
    const data = await updateCustomerCredit(req.params.credit_id, req.body);
    if (!data) {
      return res.status(404).json({ success: false, message: "Credit not found" });
    }
    res.json({
      success: true,
      message: "Credit updated.",
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCustomerCreditHandler = async (req, res) => {
  try {
    const data = await deleteCustomerCredit(req.params.credit_id);
    if (!data) {
      return res.status(404).json({ success: false, message: "Credit not found" });
    }
    res.json({
      success: true,
      message: "Credit removed.",
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const fetchOpenCreditsForCustomerHandler = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const customer_name = req.query.customer_name || "";
    const data = await getOpenCreditsForCustomer({
      customer_id,
      customer_name,
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearOpenCreditsForCustomerHandler = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const customer_name =
      req.body?.customer_name || req.query.customer_name || "";
    const data = await clearOpenCreditsForCustomer({
      customer_id,
      customer_name,
    });
    res.json({
      success: true,
      message:
        data.count > 0
          ? `Cleared ${data.count} credit${data.count === 1 ? "" : "s"}.`
          : "No open credit to clear.",
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
