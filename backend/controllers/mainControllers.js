// ═══════════════════════════════════════════════════════════════════
// controllers/mainControllers.js — COMPLETE ARCHITECTURE v2
// Order Flow: Processing→Confirmed→Shipped→Out for Delivery→Delivered
// Seller confirms orders, delivery updates via prototype/Shiprocket
// ═══════════════════════════════════════════════════════════════════
const Order   = require('../models/Order');
const User    = require('../models/User');
const Product = require('../models/Product');
const { Cart, Wishlist, Review } = require('../models/index');
const {
  sendOrderConfirmedEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
} = require('../utils/emailService');
const {
  sendOrderConfirmedSMS,
  sendOrderShippedSMS,
  sendOrderDeliveredSMS,
} = require('../utils/smsService');
const deliveryService = require('../utils/deliveryService');

// ── helpers ───────────────────────────────────────────────────────
const getSellerProductIds = async (sellerId) => {
  const products = await Product.find({ createdBy: sellerId }).select('_id');
  return products.map(p => p._id.toString());
};

const buildSellerQuery = async (sellerId, extraQuery = {}) => {
  const ids = await getSellerProductIds(sellerId);
  return {
    ...extraQuery,
    $or: [
      { 'orderItems.seller': sellerId },
      { 'orderItems.product': { $in: ids } },
    ],
  };
};

// ══════════════════════════════════════════════════════════════════
// CREATE ORDER
// Assigns seller per item, supports COD + future payment gateways
// ══════════════════════════════════════════════════════════════════
exports.createOrder = async (req, res) => {
  try {
    const {
      orderItems, shippingAddress, paymentMethod = 'COD',
      paymentResult, couponCode, discountAmount = 0,
    } = req.body;

    let subtotal = 0;
    const enrichedItems = [];

    for (const item of orderItems) {
      const product = await Product.findById(item.product)
        .populate('createdBy', '_id role');

      if (!product)
        return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      if (product.stock < item.quantity)
        return res.status(400).json({ success: false, message: `Only ${product.stock} units of "${product.name}" available` });

      subtotal += product.price * item.quantity;

      // Assign seller: null if admin-created product
      const sellerId = (product.createdBy?.role === 'seller')
        ? product.createdBy._id : null;

      enrichedItems.push({
        product:  item.product,
        seller:   sellerId,
        name:     item.name  || product.name,
        image:    item.image || product.images?.[0]?.url || '',
        price:    product.price,
        size:     item.size  || '',
        color:    item.color || '',
        quantity: item.quantity,
      });

      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    // ── Zone-based delivery charge ──────────────────────────────
    let shippingPrice = 0; // no shipping fee — delivery charge used instead
    let deliveryZone  = 'FAR_STATE';
    try {
      // Get first seller's address for delivery calculation
      const firstSellerItem = enrichedItems.find(i => i.seller);
      if (firstSellerItem) {
        const sellerUser = await User.findById(firstSellerItem.seller).select('sellerInfo addresses');
        const sellerAddr = sellerUser?.sellerInfo?.address || sellerUser?.addresses?.[0] || {};
        const delivery   = await deliveryService.getDeliveryCharge(shippingAddress, sellerAddr);

        // ── Block order if area not serviceable ───────────────────
        if (delivery.notServiceable) {
          // Restore stock before returning error
          for (const ei of enrichedItems) {
            await Product.findByIdAndUpdate(ei.product, { $inc: { stock: ei.quantity } });
          }
          return res.status(400).json({
            success:        false,
            notServiceable: true,
            message:        delivery.message || `Delivery not available to pincode ${shippingAddress?.pincode}. Please try a different address.`,
          });
        }

        shippingPrice = delivery.charge;
        deliveryZone  = delivery.zone;
      } else {
        // Admin product — default zone pricing
        shippingPrice = 0;
      }
    } catch (e) {
      console.error('Delivery charge error:', e.message);
      shippingPrice = 99;
    }

    const taxPrice   = 0;
    const totalPrice = Math.max(0, subtotal + shippingPrice - discountAmount);

    const paymentStatus = paymentMethod === 'COD' ? 'Pending' : 'Paid';
    const isPaid        = paymentMethod !== 'COD';

    const order = await Order.create({
      user:            req.user._id,
      orderItems:      enrichedItems,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      paymentResult:   paymentResult || {},
      subtotal,
      shippingPrice,
      deliveryCharge:  shippingPrice,
      deliveryZone:    deliveryZone,
      taxPrice,
      discountAmount,
      totalPrice,
      isPaid,
      paidAt:          isPaid ? Date.now() : null,
      couponCode:      couponCode || null,
      statusHistory: [{
        status:    'Processing',
        message:   'Order placed successfully',
        updatedBy: req.user._id,
      }],
    });

    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    const populated = await Order.findById(order._id)
      .populate('user', 'name email phone');

    sendOrderConfirmedEmail(populated, req.user).catch(console.error);
    if (req.user.phone) sendOrderConfirmedSMS(populated, req.user).catch(console.error);

    res.status(201).json({ success: true, order: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// GET MY ORDERS
// Customer: their orders | Seller: orders containing their products
// ══════════════════════════════════════════════════════════════════
exports.getMyOrders = async (req, res) => {
  try {
    let orders;

    if (req.user.role === 'seller') {
      const sellerProductIds = await getSellerProductIds(req.user._id);

      const [newOrders, oldOrders] = await Promise.all([
        Order.find({ 'orderItems.seller': req.user._id })
          .populate('user', 'name email phone')
          .populate('orderItems.product', 'name images price')
          .sort({ createdAt: -1 }),
        Order.find({
          'orderItems.seller': { $exists: false },
          'orderItems.product': { $in: sellerProductIds },
        })
          .populate('user', 'name email phone')
          .populate('orderItems.product', 'name images price')
          .sort({ createdAt: -1 }),
      ]);

      // Merge + deduplicate
      const map = new Map();
      [...newOrders, ...oldOrders].forEach(o => map.set(o._id.toString(), o));

      orders = Array.from(map.values())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(order => {
          const obj = order.toObject();
          obj.orderItems = obj.orderItems.filter(item => {
            if (item.seller)
              return item.seller.toString() === req.user._id.toString();
            const pid = item.product?._id?.toString() || item.product?.toString();
            return sellerProductIds.includes(pid);
          });
          return obj;
        })
        .filter(o => o.orderItems.length > 0);

    } else {
      orders = await Order.find({ user: req.user._id })
        .populate('orderItems.product', 'name images price')
        .sort({ createdAt: -1 });
    }

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// GET SINGLE ORDER
// Customer: own orders | Seller: if product is theirs | Admin: all
// ══════════════════════════════════════════════════════════════════
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('orderItems.product', 'name images price')
      .populate('orderItems.seller', 'name email');

    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });

    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    let isSeller = false;
    if (req.user.role === 'seller') {
      const sellerProductIds = await getSellerProductIds(req.user._id);
      isSeller = order.orderItems.some(item => {
        if (item.seller) return item.seller._id?.toString() === req.user._id.toString();
        const pid = item.product?._id?.toString() || item.product?.toString();
        return sellerProductIds.includes(pid);
      });
    }

    if (!isOwner && !isAdmin && !isSeller)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    // Seller sees only their items
    if (isSeller && !isAdmin) {
      const sellerProductIds = await getSellerProductIds(req.user._id);
      const obj = order.toObject();
      obj.orderItems = obj.orderItems.filter(item => {
        if (item.seller) return item.seller._id?.toString() === req.user._id.toString();
        const pid = item.product?._id?.toString() || item.product?.toString();
        return sellerProductIds.includes(pid);
      });
      return res.json({ success: true, order: obj });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// GET ALL ORDERS
// Admin: all | Seller: only their orders (filtered by role)
// ══════════════════════════════════════════════════════════════════
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const statusFilter = status ? { orderStatus: status } : {};

    let query;
    if (req.user.role === 'seller') {
      query = await buildSellerQuery(req.user._id, statusFilter);
    } else {
      query = statusFilter;
    }

    const total  = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('orderItems.seller', 'name email sellerInfo')
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, orders, total, pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// SELLER: CONFIRM ORDER  Processing → Confirmed
// ══════════════════════════════════════════════════════════════════
exports.confirmOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });

    const sellerProductIds = await getSellerProductIds(req.user._id);
    const isSeller = order.orderItems.some(item => {
      if (item.seller) return item.seller.toString() === req.user._id.toString();
      return sellerProductIds.includes(item.product?.toString());
    });

    if (!isSeller)
      return res.status(403).json({ success: false, message: 'Not authorized to confirm this order' });

    if (order.orderStatus !== 'Processing')
      return res.status(400).json({ success: false, message: `Order is already ${order.orderStatus}` });

    order.orderStatus = 'Confirmed';
    order.statusHistory.push({
      status:    'Confirmed',
      message:   'Order confirmed by seller. Ready for pickup.',
      updatedBy: req.user._id,
      timestamp: new Date(),
    });
    await order.save();

    res.json({ success: true, message: 'Order confirmed successfully', order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// UPDATE ORDER STATUS
// Admin: any status | Seller: Confirmed or Shipped only
// ══════════════════════════════════════════════════════════════════
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, trackingNumber, trackingId, courierPartner, message } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });

    if (req.user.role === 'seller') {
      const sellerProductIds = await getSellerProductIds(req.user._id);
      const isSeller = order.orderItems.some(item => {
        if (item.seller) return item.seller.toString() === req.user._id.toString();
        return sellerProductIds.includes(item.product?.toString());
      });
      if (!isSeller)
        return res.status(403).json({ success: false, message: 'Not authorized' });
      const sellerAllowed = ['Confirmed', 'Shipped'];
      if (!sellerAllowed.includes(orderStatus))
        return res.status(403).json({ success: false, message: 'Sellers can only set Confirmed or Shipped status' });
    }

    if (orderStatus === 'Cancelled' && order.orderStatus !== 'Cancelled') {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }

    order.orderStatus = orderStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (trackingId)     order.trackingId     = trackingId;
    if (courierPartner) order.courierPartner  = courierPartner;

    if (orderStatus === 'Shipped' && !order.trackingId) {
      // Create shipment (prototype: fake waybill | real: Shiprocket API)
      try {
        const sellerItem = order.orderItems.find(i => i.seller);
        const sellerUser = sellerItem ? await User.findById(sellerItem.seller) : null;
        const shipment   = await deliveryService.createShipment(order, sellerUser);
        order.trackingId      = shipment.waybill;
        order.courierPartner  = shipment.courierPartner || 'Courier';
        if (shipment.estimatedDays) {
          const eta = new Date();
          eta.setDate(eta.getDate() + shipment.estimatedDays);
          order.estimatedDelivery = eta;
        }
        console.log(`📦 Shipment created: ${shipment.waybill}`);
      } catch (e) { console.error('Shipment creation error:', e.message); }
    }

    if (orderStatus === 'Delivered') {
      order.deliveredAt    = new Date();
      order.isPaid         = true;
      order.paymentStatus  = order.paymentMethod === 'COD' ? 'Paid' : order.paymentStatus;
      order.payoutEligible = true;
    }

    order.statusHistory.push({
      status:    orderStatus,
      message:   message || `Order ${orderStatus}`,
      updatedBy: req.user._id,
      timestamp: new Date(),
    });
    await order.save();

    try {
      const orderUser = await User.findById(order.user);
      if (orderUser) {
        if (orderStatus === 'Shipped') {
          sendOrderShippedEmail(order, orderUser).catch(console.error);
          if (orderUser.phone) sendOrderShippedSMS(order, orderUser).catch(console.error);
        }
        if (orderStatus === 'Delivered') {
          sendOrderDeliveredEmail(order, orderUser).catch(console.error);
          if (orderUser.phone) sendOrderDeliveredSMS(order, orderUser).catch(console.error);
        }
      }
    } catch (e) { console.error('Notification error:', e.message); }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// CANCEL ORDER (Customer)
// ══════════════════════════════════════════════════════════════════
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    if (['Shipped', 'Out for Delivery', 'Delivered'].includes(order.orderStatus))
      return res.status(400).json({ success: false, message: `Cannot cancel. Order is already ${order.orderStatus}.` });
    if (order.orderStatus === 'Cancelled')
      return res.status(400).json({ success: false, message: 'Order already cancelled' });

    const CANCELLATION_FEE = 50;
    const wasPaidOnline    = order.isPaid && order.paymentMethod !== 'COD';
    const refundAmount     = wasPaidOnline ? Math.max(0, order.totalPrice - CANCELLATION_FEE) : 0;

    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    order.orderStatus     = 'Cancelled';
    order.cancellationFee = wasPaidOnline ? CANCELLATION_FEE : 0;
    order.refundAmount    = refundAmount;
    order.refundStatus    = wasPaidOnline ? 'Pending' : 'NA';
    if (wasPaidOnline) order.paymentStatus = 'Refunded';

    order.statusHistory.push({
      status:    'Cancelled',
      message:   wasPaidOnline
        ? `Cancelled by customer. Refund ₹${refundAmount} (after ₹${CANCELLATION_FEE} fee) in 5-7 days.`
        : 'Cancelled by customer.',
      updatedBy: req.user._id,
      timestamp: new Date(),
    });
    await order.save();

    res.json({
      success:         true,
      message:         wasPaidOnline
        ? `Order cancelled. ₹${refundAmount} refunded in 5-7 days.`
        : 'Order cancelled successfully.',
      order,
      refundAmount,
      cancellationFee: order.cancellationFee,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// ADMIN ANALYTICS — Orders with Seller Breakdown
// ══════════════════════════════════════════════════════════════════
exports.getOrderAnalytics = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const ranges = {
      today: new Date(new Date().setHours(0,0,0,0)),
      week:  new Date(Date.now() - 7   * 24*60*60*1000),
      month: new Date(Date.now() - 30  * 24*60*60*1000),
      year:  new Date(Date.now() - 365 * 24*60*60*1000),
    };
    const since = ranges[period] || ranges.week;

    const [totalOrders, periodOrders, revenueData, ordersByStatus, sellerBreakdown, dailyData] =
      await Promise.all([
        Order.countDocuments({ orderStatus: { $ne: 'Cancelled' } }),
        Order.countDocuments({ orderStatus: { $ne: 'Cancelled' }, createdAt: { $gte: since } }),
        Order.aggregate([
          { $match: { orderStatus: { $ne: 'Cancelled' } } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]),
        Order.aggregate([
          { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
        ]),
        Order.aggregate([
          { $match: { orderStatus: { $ne: 'Cancelled' } } },
          { $unwind: '$orderItems' },
          { $match: { 'orderItems.seller': { $ne: null } } },
          { $group: {
            _id:     '$orderItems.seller',
            revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
            orders:  { $addToSet: '$_id' },
            items:   { $sum: '$orderItems.quantity' },
          }},
          { $lookup: { from:'users', localField:'_id', foreignField:'_id', as:'seller' } },
          { $unwind: { path:'$seller', preserveNullAndEmptyArrays:true } },
          { $project: {
            sellerName:   '$seller.name',
            sellerEmail:  '$seller.email',
            businessName: '$seller.sellerInfo.businessName',
            revenue:      1,
            orderCount:   { $size: '$orders' },
            itemsSold:    '$items',
          }},
          { $sort: { revenue: -1 } },
        ]),
        Order.aggregate([
          { $match: { createdAt: { $gte: since }, orderStatus: { $ne: 'Cancelled' } } },
          { $group: {
            _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            orders:  { $sum: 1 },
            revenue: { $sum: '$totalPrice' },
          }},
          { $sort: { _id: 1 } },
        ]),
      ]);

    res.json({
      success: true,
      analytics: {
        totalOrders, periodOrders,
        totalRevenue: revenueData[0]?.total || 0,
        ordersByStatus, sellerBreakdown, dailyData,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// ADMIN RESET ROUTES
// ══════════════════════════════════════════════════════════════════
exports.deleteAllOrders = async (req, res) => {
  try {
    const result = await Order.deleteMany({});
    res.json({ success: true, message: `${result.deletedCount} orders deleted.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetRevenueData = async (req, res) => {
  try {
    const result = await Order.updateMany({}, { $set: { totalPrice: 0, subtotal: 0, taxPrice: 0 } });
    res.json({ success: true, message: `${result.modifiedCount} orders reset.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMyOrders = async (req, res) => {
  try {
    const query  = await buildSellerQuery(req.user._id);
    const result = await Order.deleteMany(query);
    res.json({ success: true, message: `${result.deletedCount} orders deleted.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ══════════════════════════════════════════════════════════════════
// CART CONTROLLERS
// ══════════════════════════════════════════════════════════════════
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name images price stock sizes colors createdBy',
        populate: {
          path: 'createdBy',
          select: 'name role sellerInfo',
        },
      });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
    res.json({ success: true, cart });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, size, color, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });
    const idx = cart.items.findIndex(i => i.product.toString() === productId && i.size === size && i.color === color);
    if (idx >= 0) cart.items[idx].quantity += quantity;
    else cart.items.push({ product: productId, size, color, quantity, price: product.price });
    await cart.save();
    await cart.populate('items.product', 'name images price stock');
    res.json({ success: true, cart });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    if (quantity <= 0) cart.items.pull(req.params.itemId);
    else item.quantity = quantity;
    await cart.save();
    await cart.populate('items.product', 'name images price stock');
    res.json({ success: true, cart });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    cart.items.pull(req.params.itemId);
    await cart.save();
    res.json({ success: true, cart });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};


// ══════════════════════════════════════════════════════════════════
// WISHLIST CONTROLLERS
// ══════════════════════════════════════════════════════════════════
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('products', 'name images price discountPrice ratings category');
    if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    res.json({ success: true, wishlist });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) wishlist = new Wishlist({ user: req.user._id, products: [] });
    const idx    = wishlist.products.indexOf(productId);
    const action = idx >= 0 ? 'removed' : 'added';
    if (idx >= 0) wishlist.products.splice(idx, 1);
    else wishlist.products.push(productId);
    await wishlist.save();
    res.json({ success: true, action, wishlist });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};


// ══════════════════════════════════════════════════════════════════
// REVIEW CONTROLLERS
// ══════════════════════════════════════════════════════════════════
exports.createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;
    const existing = await Review.findOne({ user: req.user._id, product: productId });
    if (existing) return res.status(400).json({ success: false, message: 'Already reviewed' });
    const review  = await Review.create({ user: req.user._id, product: productId, rating, title, comment });
    const reviews = await Review.find({ product: productId });
    const avg     = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(productId, { ratings: parseFloat(avg.toFixed(1)), numReviews: reviews.length });
    await review.populate('user', 'name avatar');
    res.status(201).json({ success: true, review });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name avatar').sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });
    await review.deleteOne();
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};