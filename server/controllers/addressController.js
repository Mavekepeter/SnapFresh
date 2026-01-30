import Address from "../models/Address.js";

//add Address :/api/address/add
export const addAdress = async (req, res) => {
  try {
    console.log("📦 Received address data:", req.body); // 👈 add this

    const { userId } = req.body;
    if (!userId) {
      return res.json({
        success: false,
        message: "❌ userId missing in request body",
      });
    }

    const address = await Address.create(req.body);
    res.json({ success: true, message: "✅ Address added successfully", address });
  } catch (error) {
    console.error("Add address error:", error.message);
    res.json({ success: false, message: error.message });
  }
};


//get Address : /api/address/get
export const getAddress = async (req, res) => {
  try {
    const { userId } = req.query;
    const addresses = await Address.find({ userId });
    res.json({ success: true, addresses });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
