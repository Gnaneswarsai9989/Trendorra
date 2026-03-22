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

// ══════════════════════════════════════════════════════════════════
// ORDER CONTROLLERS
// ══════════════════════════════════════════════════════════════════

// ── Create Order ──────────────────────────────────────────────────
// FIX: stores seller per orderItem so each seller can filter later
exports.createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, paymentResult } = req.body;

    let subtotal = 0;
    const enrichedItems = [];

    for (const item of orderItems) {
      const product = await Product.findById(item.product).populate('createdBy', '_id role');
      if (!product)
        return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      if (product.stock < item.quantity)
        return res.status(400).json({ success: false, message: `Only ${product.stock} units of "${product.name}" available` });

      subtotal += product.price * item.quantity;

      // ✅ Store sellerId per item — null if created by admin
      const sellerId = (product.createdBy && product.createdBy.role === 'seller')
        ? product.createdBy._id
        : null;

      enrichedItems.push({
        product:  item.product,
        name:     item.name  || product.name,
        image:    item.image || product.images?.[0]?.url || '',
        price:    product.price,
        size:     item.size  || '',
        color:    item.color || '',
        quantity: item.quantity,
        seller:   sellerId,   // ← KEY FIX
      });

      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    const shippingPrice = subtotal >= 999 ? 0 : 99;
    const taxPrice      = Math.round(subtotal * 0.18);
    const totalPrice    = subtotal + shippingPrice + taxPrice;

    const order = await Order.create({
      user:            req.user._id,
      orderItems:      enrichedItems,
      shippingAddress,
      paymentMethod,
      paymentResult,
      subtotal,
      shippingPrice,
      taxPrice,
      totalPrice,
      isPaid:  paymentMethod !== 'COD',
      paidAt:  paymentMethod !== 'COD' ? Date.now() : null,
      statusHistory: [{ status: 'Processing', message: 'Order placed successfully' }],
    });

    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    const populatedOrder = await Order.findById(order._id);
    sendOrderConfirmedEmail(populatedOrder, req.user).catch(console.error);
    if (req.user.phone) sendOrderConfirmedSMS(populatedOrder, req.user).catch(console.error);

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get My Orders ─────────────────────────────────────────────────
// Customer : their own orders
// Seller   : orders containing their products (new + old format)
exports.getMyOrders = async (req, res) => {
  try {
    let orders;

    if (req.user.role === 'seller') {
      // Get seller's product IDs for old-format fallback
      const sellerProducts    = await Product.find({ createdBy: req.user._id }).select('_id');
      const sellerProductIds  = sellerProducts.map(p => p._id.toString());

      // ✅ Query both new format (seller field) and old format (product lookup)
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
      const orderMap = new Map();
      [...newOrders, ...oldOrders].forEach(o => orderMap.set(o._id.toString(), o));

      orders = Array.from(orderMap.values())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(order => {
          const obj = order.toObject ? order.toObject() : order;
          // Only show this seller's items
          const myItems = obj.orderItems.filter(item => {
            if (item.seller) {
              return item.seller.toString() === req.user._id.toString();
            }
            // old format fallback
            const pid = item.product?._id?.toString() || item.product?.toString();
            return sellerProductIds.includes(pid);
          });
          return { ...obj, orderItems: myItems };
        })
        .filter(o => o.orderItems.length > 0);

    } else {
      // Regular customer
      orders = await Order.find({ user: req.user._id })
        .populate('orderItems.product', 'name images')
        .sort({ createdAt: -1 });
    }

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get Single Order ──────────────────────────────────────────────
// FIX: seller can now view orders that contain their products
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('orderItems.product', 'name images price');

    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });

    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    // Seller access: check if any item belongs to them
    let isSeller = false;
    if (req.user.role === 'seller') {
      const sellerProducts   = await Product.find({ createdBy: req.user._id }).select('_id');
      const sellerProductIds = sellerProducts.map(p => p._id.toString());
      isSeller = order.orderItems.some(item => {
        if (item.seller) return item.seller.toString() === req.user._id.toString();
        const pid = item.product?._id?.toString() || item.product?.toString();
        return sellerProductIds.includes(pid);
      });
    }

    if (!isOwner && !isAdmin && !isSeller)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    // Seller only sees their items
    if (isSeller && !isAdmin) {
      const sellerProducts   = await Product.find({ createdBy: req.user._id }).select('_id');
      const sellerProductIds = sellerProducts.map(p => p._id.toString());
      const orderObj = order.toObject();
      orderObj.orderItems = orderObj.orderItems.filter(item => {
        if (item.seller) return item.seller.toString() === req.user._id.toString();
        const pid = item.product?._id?.toString() || item.product?.toString();
        return sellerProductIds.includes(pid);
      });
      return res.json({ success: true, order: orderObj });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get All Orders ────────────────────────────────────────────────
// Admin : all orders
// Seller: only orders containing their products
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    let query = status ? { orderStatus: status } : {};

    if (req.user.role === 'seller') {
      const sellerProducts   = await Product.find({ createdBy: req.user._id }).select('_id');
      const sellerProductIds = sellerProducts.map(p => p._id);
      query = {
        ...query,
        $or: [
          { 'orderItems.seller': req.user._id },
          { 'orderItems.product': { $in: sellerProductIds } },
        ],
      };
    }

    const total  = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, orders, total, pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Update Order Status (Admin) ───────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, trackingNumber, message } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (orderStatus === 'Cancelled' && order.orderStatus !== 'Cancelled') {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }

    order.orderStatus = orderStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (orderStatus === 'Delivered') {
      order.deliveredAt    = Date.now();
      order.isPaid         = true;
      order.payoutEligible = true;
    }
    order.statusHistory.push({ status: orderStatus, message: message || `Order ${orderStatus}` });
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

// ── Cancel Order (Customer) ───────────────────────────────────────
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    if (['Shipped', 'Out for Delivery', 'Delivered'].includes(order.orderStatus))
      return res.status(400).json({ success: false, message: `Cannot cancel. Order already ${order.orderStatus}.` });
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
    order.statusHistory.push({
      status: 'Cancelled',
      message: wasPaidOnline
        ? `Cancelled by customer. Refund of ₹${refundAmount} (after ₹${CANCELLATION_FEE} cancellation fee) will be processed in 5-7 days.`
        : 'Cancelled by customer.',
    });
    await order.save();

    res.json({
      success:         true,
      message:         wasPaidOnline
        ? `Order cancelled. ₹${refundAmount} will be refunded within 5-7 business days (₹${CANCELLATION_FEE} cancellation fee deducted).`
        : 'Order cancelled successfully.',
      order,
      refundAmount,
      cancellationFee: order.cancellationFee,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Admin: Delete All Orders ──────────────────────────────────────
exports.deleteAllOrders = async (req, res) => {
  try {
    const result = await Order.deleteMany({});
    res.status(200).json({
      success: true,
      message: `All orders permanently deleted. (${result.deletedCount} records removed)`,
    });
  } catch (error) {
    console.error('deleteAllOrders error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting orders' });
  }
};

// ── Admin: Reset Revenue ──────────────────────────────────────────
exports.resetRevenueData = async (req, res) => {
  try {
    const result = await Order.updateMany(
      {},
      { $set: { totalPrice: 0, subtotal: 0, taxPrice: 0, shippingPrice: 0 } }
    );
    res.status(200).json({
      success: true,
      message: `Revenue data reset to zero. (${result.modifiedCount} orders updated)`,
    });
  } catch (error) {
    console.error('resetRevenueData error:', error);
    res.status(500).json({ success: false, message: 'Server error while resetting revenue' });
  }
};

// ── Seller: Delete Only Their Orders ─────────────────────────────
exports.deleteMyOrders = async (req, res) => {
  try {
    const sellerProducts   = await Product.find({ createdBy: req.user._id }).select('_id');
    const sellerProductIds = sellerProducts.map(p => p._id);

    const result = await Order.deleteMany({
      $or: [
        { 'orderItems.seller': req.user._id },
        { 'orderItems.product': { $in: sellerProductIds } },
      ],
    });

    res.status(200).json({
      success:      true,
      message:      `${result.deletedCount} order(s) permanently deleted.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('deleteMyOrders error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting orders' });
  }
};


// ══════════════════════════════════════════════════════════════════
// CART CONTROLLERS
// ══════════════════════════════════════════════════════════════════

exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name images price stock sizes colors');
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, size, color, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    const existingIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.size === size && item.color === color
    );
    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, size, color, quantity, price: product.price });
    }

    await cart.save();
    await cart.populate('items.product', 'name images price stock');
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (quantity <= 0) {
      cart.items.pull(req.params.itemId);
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.product', 'name images price stock');
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    cart.items.pull(req.params.itemId);
    await cart.save();
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) wishlist = new Wishlist({ user: req.user._id, products: [] });

    const index  = wishlist.products.indexOf(productId);
    const action = index >= 0 ? 'removed' : 'added';
    if (index >= 0) wishlist.products.splice(index, 1);
    else wishlist.products.push(productId);

    await wishlist.save();
    res.json({ success: true, action, wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ══════════════════════════════════════════════════════════════════
// REVIEW CONTROLLERS
// ══════════════════════════════════════════════════════════════════

exports.createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;

    const existingReview = await Review.findOne({ user: req.user._id, product: productId });
    if (existingReview)
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });

    const review = await Review.create({ user: req.user._id, product: productId, rating, title, comment });

    const reviews   = await Review.find({ product: productId });
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(productId, {
      ratings:    parseFloat(avgRating.toFixed(1)),
      numReviews: reviews.length,
    });

    await review.populate('user', 'name avatar');
    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });
    await review.deleteOne();
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};