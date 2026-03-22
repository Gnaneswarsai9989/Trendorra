// ═══════════════════════════════════════════════════════════════════
// controllers/userController.js
// ═══════════════════════════════════════════════════════════════════
const User  = require('../models/User');
const Order = require('../models/Order');

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const query = role ? { role } : {};
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// ══════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD STATS
// ══════════════════════════════════════════════════════════════════
exports.getDashboardStats = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const ranges = {
      today: new Date(new Date().setHours(0,0,0,0)),
      week:  new Date(Date.now() - 7   * 24*60*60*1000),
      month: new Date(Date.now() - 30  * 24*60*60*1000),
      year:  new Date(Date.now() - 365 * 24*60*60*1000),
    };
    const since     = ranges[period] || ranges.week;
    const dayCount  = { today:1, week:7, month:30, year:365 }[period] || 7;
    const validOrders = { orderStatus: { $ne: 'Cancelled' } };

    const [
      totalUsers, totalSellers, totalOrders, revenueData,
      periodRevenueData, recentOrders, ordersByStatus,
      periodOrders, topProductsRaw, categoryBreakdown,
      dailyDataRaw, cancelledCount,
      sellerStats,
    ] = await Promise.all([

      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'seller' }),
      Order.countDocuments(validOrders),

      Order.aggregate([
        { $match: validOrders },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),

      Order.aggregate([
        { $match: { ...validOrders, createdAt: { $gte: since } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),

      Order.find()
        .sort({ createdAt: -1 }).limit(10)
        .populate('user', 'name email')
        .populate('orderItems.seller', 'name sellerInfo'),

      Order.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      ]),

      Order.countDocuments({ ...validOrders, createdAt: { $gte: since } }),

      Order.aggregate([
        { $match: validOrders },
        { $unwind: '$orderItems' },
        { $group: {
          _id:       '$orderItems.product',
          name:      { $first: '$orderItems.name' },
          image:     { $first: '$orderItems.image' },
          soldCount: { $sum: '$orderItems.quantity' },
          revenue:   { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
        }},
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),

      Order.aggregate([
        { $match: validOrders },
        { $unwind: '$orderItems' },
        { $lookup: { from: 'products', localField: 'orderItems.product', foreignField: '_id', as: 'prod' } },
        { $unwind: { path: '$prod', preserveNullAndEmptyArrays: true } },
        { $group: {
          _id:     '$prod.category',
          count:   { $sum: '$orderItems.quantity' },
          revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
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

      Order.countDocuments({ orderStatus: 'Cancelled' }),

      // ── Seller breakdown: full stats per seller ────────────────
      // Handles NEW orders (orderItems.seller) + OLD orders (product.createdBy)
      // Includes: status counts, delivered revenue, days since last delivery
      Order.aggregate([
        { $unwind: '$orderItems' },

        // Get product to find seller for old orders
        { $lookup: { from: 'products', localField: 'orderItems.product', foreignField: '_id', as: 'prod' } },
        { $unwind: { path: '$prod', preserveNullAndEmptyArrays: true } },

        // effectiveSeller = orderItems.seller if set, else product.createdBy
        { $addFields: {
          effectiveSeller: {
            $cond: {
              if:   { $and: [{ $ne: ['$orderItems.seller', null] }, { $ne: ['$orderItems.seller', undefined] }] },
              then: '$orderItems.seller',
              else: '$prod.createdBy',
            }
          }
        }},

        // Only keep seller-role items
        { $lookup: { from: 'users', localField: 'effectiveSeller', foreignField: '_id', as: 'sellerCheck' } },
        { $unwind: { path: '$sellerCheck', preserveNullAndEmptyArrays: true } },
        { $match: { 'sellerCheck.role': 'seller' } },

        // Group by seller — collect all needed fields
        { $group: {
          _id:  '$effectiveSeller',

          // Revenue from non-cancelled orders
          revenue: { $sum: {
            $cond: [ { $ne: ['$orderStatus','Cancelled'] },
              { $multiply: ['$orderItems.price', '$orderItems.quantity'] }, 0 ]
          }},

          // All unique order IDs
          allOrders: { $addToSet: '$_id' },

          // Items sold (non-cancelled)
          items: { $sum: {
            $cond: [ { $ne: ['$orderStatus','Cancelled'] }, '$orderItems.quantity', 0 ]
          }},

          // ── Order status counts ───────────────────────────────
          processingOrders: { $sum: { $cond: [{ $eq: ['$orderStatus','Processing']       }, 1, 0] } },
          confirmedOrders:  { $sum: { $cond: [{ $eq: ['$orderStatus','Confirmed']         }, 1, 0] } },
          shippedOrders:    { $sum: { $cond: [{ $eq: ['$orderStatus','Shipped']           }, 1, 0] } },
          outForDelivery:   { $sum: { $cond: [{ $eq: ['$orderStatus','Out for Delivery']  }, 1, 0] } },
          deliveredOrders:  { $sum: { $cond: [{ $eq: ['$orderStatus','Delivered']         }, 1, 0] } },
          cancelledOrders:  { $sum: { $cond: [{ $eq: ['$orderStatus','Cancelled']         }, 1, 0] } },

          // ── Payout fields ─────────────────────────────────────
          // Only delivered orders are payout eligible
          deliveredRevenue: { $sum: {
            $cond: [ { $eq: ['$orderStatus','Delivered'] },
              { $multiply: ['$orderItems.price', '$orderItems.quantity'] }, 0 ]
          }},

          // Last delivery date — for "X days since delivery"
          lastDeliveredAt: { $max: {
            $cond: [ { $eq: ['$orderStatus','Delivered'] }, '$deliveredAt', null ]
          }},
        }},

        // Join seller user data
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'sellerData' } },
        { $unwind: { path: '$sellerData', preserveNullAndEmptyArrays: true } },

        { $project: {
          sellerName:       '$sellerData.name',
          sellerEmail:      '$sellerData.email',
          businessName:     '$sellerData.sellerInfo.businessName',
          status:           '$sellerData.sellerInfo.status',
          paidOut:          { $ifNull: ['$sellerData.sellerInfo.totalPaidOut', 0] },
          // counts
          revenue:          1,
          orderCount:       { $size: '$allOrders' },
          itemsSold:        '$items',
          processingOrders: 1,
          confirmedOrders:  1,
          shippedOrders:    1,
          outForDelivery:   1,
          deliveredOrders:  1,
          cancelledOrders:  1,
          deliveredRevenue: 1,
          lastDeliveredAt:  1,
        }},

        { $sort: { revenue: -1 } },
      ]),
    ]);

    // Build daily chart arrays
    const dailyOrders  = [];
    const dailyRevenue = [];
    for (let i = dayCount - 1; i >= 0; i--) {
      const d   = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const f   = dailyDataRaw.find(r => r._id === key);
      dailyOrders.push(f?.orders  || 0);
      dailyRevenue.push(f?.revenue || 0);
    }

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalSellers,
        totalOrders,
        cancelledCount,
        totalRevenue:  revenueData[0]?.total || 0,
        periodRevenue: periodRevenueData[0]?.total || 0,
        weeklyRevenue: dailyRevenue.reduce((a, b) => a + b, 0),
        periodOrders,
        ordersByStatus,
        recentOrders,
        topProducts:      topProductsRaw.map(p => ({ ...p, _id: p._id?.toString() })),
        categoryBreakdown,
        dailyOrders,
        dailyRevenue,
        sellerStats,
        period,
        dayCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// RECORD SELLER PAYOUT
// ══════════════════════════════════════════════════════════════════
exports.processPayout = async (req, res) => {
  try {
    const { amount, note } = req.body;
    const seller = await User.findById(req.params.id);
    if (!seller || seller.role !== 'seller')
      return res.status(404).json({ success: false, message: 'Seller not found' });

    if (!seller.sellerInfo.payoutHistory) seller.sellerInfo.payoutHistory = [];
    seller.sellerInfo.payoutHistory.push({
      amount:      Number(amount),
      note:        note || '',
      processedAt: new Date(),
      processedBy: req.user._id,
    });
    seller.sellerInfo.totalPaidOut = (seller.sellerInfo.totalPaidOut || 0) + Number(amount);
    await seller.save();

    console.log(`💸 Payout ₹${amount} to ${seller.email}`);
    res.json({ success: true, message: `Payout of ₹${amount} recorded for ${seller.name}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// CLEAR SELLER PAYOUT HISTORY
// ══════════════════════════════════════════════════════════════════
exports.clearPayoutHistory = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);
    if (!seller || seller.role !== 'seller')
      return res.status(404).json({ success: false, message: 'Seller not found' });

    seller.sellerInfo.payoutHistory = [];
    seller.sellerInfo.totalPaidOut  = 0;
    await seller.save();

    console.log(`🗑️ Payout history cleared for ${seller.email}`);
    res.json({ success: true, message: `Payout history cleared for ${seller.name}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};