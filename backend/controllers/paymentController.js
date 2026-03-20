const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpay = null;

// Initialize Razorpay only if keys exist
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// ==============================
// Create Razorpay Order
// ==============================
exports.createRazorpayOrder = async (req, res) => {
  try {

    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: "Razorpay is not configured yet"
      });
    }

    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({
        success:false,
        message:"Amount is required"
      });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    res.status(500).json({
      success:false,
      message:error.message
    });
  }
};


// ==============================
// Verify Razorpay Payment
// ==============================
exports.verifyRazorpayPayment = async (req, res) => {
  try {

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success:false,
        message:"Razorpay not configured"
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success:false,
        message:"Payment verification failed"
      });
    }

    res.json({
      success:true,
      message:"Payment verified successfully",
      paymentId: razorpay_payment_id
    });

  } catch (error) {
    res.status(500).json({
      success:false,
      message:error.message
    });
  }
};


// ==============================
// Stripe Payment Intent
// ==============================
exports.createStripeIntent = async (req, res) => {
  try {

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({
        success:false,
        message:"Stripe is not configured"
      });
    }

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({
        success:false,
        message:"Amount is required"
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "inr"
    });

    res.json({
      success:true,
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    res.status(500).json({
      success:false,
      message:error.message
    });
  }
};