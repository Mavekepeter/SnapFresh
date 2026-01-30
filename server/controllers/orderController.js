import Order from "../models/Order.js";
import Product from "../models/product.js";
import stripe from "stripe";
import User from '../models/Users.js'
import axios from "axios";

//place order cod :/api/order/cod
export const placeOrderCod = async (req, res) => {
  try {
    const { userId, items, address } = req.body;
    if (!address || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }
    //calculate amount using items
    let amount = await items.reduce(async (acc, item) => {
      const product = await Product.findById(item.product);
      return (await acc) + product.offerPrice * item.quantity;
    }, 0);

    //Add Tax charge (2%)
    amount += Math.floor(amount * 0.02);

    await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType: "COD",
    });
    return res.json({ success: true, message: "Order placed successfully" });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

// Place order stripe: /api/order/stripe
export const placeOrderStripe = async (req, res) => {
  try {
    const { userId, items, address } = req.body;
    const { origin } = req.headers;

    if (!address || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }

    let productData = [];
    //calculate amount using items
    let amount = await items.reduce(async (acc, item) => {
      const product = await Product.findById(item.product);
      productData.push({
        name: product.name,
        price: product.offerPrice,
        quantity: item.quantity,
      });
      return (await acc) + product.offerPrice * item.quantity;
    }, 0);
    //Add Tax charge (2%)
    amount += Math.floor(amount * 0.02);

    const order = await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType: "Online",
    });

    //Stripe gateway initialized
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    //create line iem for stripe
    const line_items = productData.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.floor(item.price * 1.02 * 100), // 2% tax included
      },
      quantity: item.quantity,
    }));

    //create session
    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${origin}/loader?next=my-orders`,
      cancel_url: `${origin}/cart`,
      metadata: {
        orderId: order._id.toString(),
      },
    });

    return res.json({ success: true, url: session.url });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

//Stripe webhook to verify Payment Action :/stripe
export const stripeWebhook = async(request,response)=>{
//stripe gateway initializer
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
const sig = req.headers["stripe-signature"]
let event;
try {
  event = stripeInstance.webhooks.constructEvent(
    request.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
} catch (error) {
  response.status(400).send(`Webhook Error:${error.message}`)
}
//Handle event
switch (event.type) {
  
    case 'payment_intent.succeeded':{
    const paymentIntent = event.data.object;
    const paymentIntentId = paymentIntent.id;

    //Getting Session Meta Data
    const session = await stripeInstance.checkout.sessions.list({
      payment_intent:paymentIntentId,

    });
    const {orderId,userId} = session.data[0].metadata;
    //Mark payment as down

    await Order.findByIdAndUpdate(orderId,{isPaid:true})

    //Clear user Cart
    await user.findByIdAndUpdate(userId,{cartItems:{}});
    break;
  }
  case 'payment_intent.payment_failed':{
    const paymentIntent = event.data.object;
    const paymentIntentId = paymentIntent.id;

    //Getting Session Meta Data
    const session = await stripeInstance.checkout.sessions.list({
      payment_intent:paymentIntentId,

    });
    const {orderId} = session.data[0].metadata;
    await Order.findOneAndDelete(orderId)
  }
  default:
    console.error(`unhandled event type ${event.type}`);
  
    break;
}
response.json({received:true})

}
// ================= M-PESA STK PUSH =================

// Direct test credentials (NO .env)
const MPESA = {
  consumerKey: "XGLuhIXXQ2A1ynRnFLhIcbrBXudigjWSt60f3cnEBox1HQhd",
  consumerSecret: "5CcQMDRb8sjGni937EJNewmPf9lRIKCDiQ3mSVsDXWtmzAlCUU7QCPEyaqhfxdS0",
  shortCode: "174379",
  passKey:
    "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
  partyB: "600000",
};

const getMpesaToken = async () => {
  const auth = Buffer.from(
    `${MPESA.consumerKey}:${MPESA.consumerSecret}`
  ).toString("base64");

  const { data } = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${auth}` } }
  );

  return data.access_token;
};

// 🟢 Place order and trigger M-Pesa STK Push
export const placeOrderMpesa = async (req, res) => {
  try {
    const { userId, items, address, phone } = req.body;

    if (!userId || !address || !phone || !items?.length)
      return res.status(400).json({ success: false, message: "Missing required data" });

    let amount = await items.reduce(async (acc, item) => {
      const product = await Product.findById(item.product);
      return (await acc) + product.offerPrice * item.quantity;
    }, 0);

    amount = Math.ceil(amount * 1.02);

    const order = await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType: "M-Pesa",
      isPaid: false,
    });

    const token = await getMpesaToken();

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);
    const password = Buffer.from(
      `${MPESA.shortCode}${MPESA.passKey}${timestamp}`
    ).toString("base64");

    const phoneNumber = phone.startsWith("254") ? phone : `254${phone.slice(-9)}`;

    const requestData = {
      BusinessShortCode: MPESA.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: MPESA.shortCode,
      PhoneNumber: phoneNumber,
      CallBackURL: "https://sandbox.safaricom.co.ke/mpesa/callback",
      AccountReference: `Order${order._id}`,
      TransactionDesc: "E-commerce Purchase",
    };

    const { data: stkResponse } = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      requestData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json({
      success: true,
      message: "STK Push sent successfully. Complete payment on your phone.",
      data: stkResponse,
      orderId: order._id,
    });
  } catch (error) {
    console.error("M-Pesa STK Push Error:", error.response?.data || error.message);
    res.status(400).json({
      success: false,
      message: error.response?.data?.errorMessage || "M-Pesa STK Push failed",
      details: error.response?.data,
    });
  }
};

// ================= CALLBACK =================
export const mpesaCallback = async (req, res) => {
  try {
    const callback = req.body.Body?.stkCallback;
    if (!callback)
      return res.status(400).json({ success: false, message: "Invalid callback format" });

    const { ResultCode, CallbackMetadata } = callback;

    if (ResultCode === 0) {
      const metadata = CallbackMetadata?.Item || [];
      const mpesaReceipt = metadata.find(i => i.Name === "MpesaReceiptNumber")?.Value;
      const accountRef = metadata.find(i => i.Name === "AccountReference")?.Value;
      const orderId = accountRef?.replace("Order", "");

      await Order.findByIdAndUpdate(orderId, {
        isPaid: true,
        paymentStatus: "Paid",
        mpesaReceipt,
      });

      console.log(`✅ Payment Success | Order: ${orderId} | Receipt: ${mpesaReceipt}`);
      res.json({ success: true });
    } else {
      console.log("Payment Failed or Cancelled");
      res.json({ success: false });
    }
  } catch (error) {
    console.error("Callback Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
//Get Orders by UserId: /api/order/user
export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.json({ success: false, message: "Missing userId" });
    }

    const orders = await Order.find({
      userId,
      $or: [{ paymentType: "COD" }, { isPaid: true }],
    })
      .populate("items.product address")
      .sort({ createdAt: -1 });

    res.json({ success: true, order: orders });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

//Get all orders (for seller/admin) :/api/order/seller

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ paymentType: "COD" }, { isPaid: true }],
    }).populate("items.product address");
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
