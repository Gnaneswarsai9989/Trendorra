// ═══════════════════════════════════════════════════════════════════
// controllers/userController.js — COMPLETE WITH SELLER ANALYTICS
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
// Includes: total stats + per-seller breakdown + daily charts
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
    const since    = ranges[period] || ranges.week;
    const dayCount = { today:1, week:7, month:30, year:365 }[period] || 7;
    const validOrders = { orderStatus: { $ne: 'Cancelled' } };

    const [
      totalUsers, totalSellers, totalOrders, revenueData,
      periodRevenueData, recentOrders, ordersByStatus,
      periodOrders, topProductsRaw, categoryBreakdown,
      dailyDataRaw, cancelledCount,
      // Per-seller stats (admin analytics)
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
        { $lookup: { from:'products', localField:'orderItems.product', foreignField:'_id', as:'prod' } },
        { $unwind: { path:'$prod', preserveNullAndEmptyArrays:true } },
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
          _id:     { $dateToString: { format:'%Y-%m-%d', date:'$createdAt' } },
          orders:  { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        }},
        { $sort: { _id: 1 } },
      ]),

      Order.countDocuments({ orderStatus: 'Cancelled' }),

      // ── Seller breakdown: handles NEW orders (seller field) + OLD orders (product.createdBy)
      Order.aggregate([
        { $match: validOrders },
        { $unwind: '$orderItems' },
        // Lookup product to get createdBy for old orders that have no seller field
        { $lookup: { from: 'products', localField: 'orderItems.product', foreignField: '_id', as: 'prod' } },
        { $unwind: { path: '$prod', preserveNullAndEmptyArrays: true } },
        // Use seller field if set, otherwise fall back to product.createdBy
        { $addFields: {
          effectiveSeller: {
            $cond: {
              if:   { $and: [{ $ne: ['$orderItems.seller', null] }, { $ne: ['$orderItems.seller', undefined] }] },
              then: '$orderItems.seller',
              else: '$prod.createdBy',
            }
          }
        }},
        // Only keep items where the effective seller is actually a seller role
        { $lookup: { from: 'users', localField: 'effectiveSeller', foreignField: '_id', as: 'sellerCheck' } },
        { $unwind: { path: '$sellerCheck', preserveNullAndEmptyArrays: true } },
        { $match: { 'sellerCheck.role': 'seller' } },
        { $group: {
          _id:     '$effectiveSeller',
          revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
          orders:  { $addToSet: '$_id' },
          items:   { $sum: '$orderItems.quantity' },
        }},
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'sellerData' } },
        { $unwind: { path: '$sellerData', preserveNullAndEmptyArrays: true } },
        { $project: {
          sellerName:   '$sellerData.name',
          sellerEmail:  '$sellerData.email',
          businessName: '$sellerData.sellerInfo.businessName',
          status:       '$sellerData.sellerInfo.status',
          revenue:      1,
          orderCount:   { $size: '$orders' },
          itemsSold:    '$items',
          paidOut:      { $ifNull: ['$sellerData.sellerInfo.totalPaidOut', 0] },
        }},
        { $sort: { revenue: -1 } },
      ]),
    ]);

    // Build daily arrays
    const dailyOrders  = [];
    const dailyRevenue = [];
    for (let i = dayCount - 1; i >= 0; i--) {
      const d   = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0,10);
      const f   = dailyDataRaw.find(r => r._id === key);
      dailyOrders.push(f?.orders || 0);
      dailyRevenue.push(f?.revenue || 0);
    }

    res.json({
      success: true,
      stats: {
        totalUsers,   totalSellers,
        totalOrders,  cancelledCount,
        totalRevenue:  revenueData[0]?.total || 0,
        periodRevenue: periodRevenueData[0]?.total || 0,
        weeklyRevenue: dailyRevenue.reduce((a,b)=>a+b,0),
        periodOrders,
        ordersByStatus,
        recentOrders,
        topProducts: topProductsRaw.map(p => ({ ...p, _id: p._id?.toString() })),
        categoryBreakdown,
        dailyOrders,   dailyRevenue,
        sellerStats,   // per-seller breakdown
        period,        dayCount,
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
    res.status(500).json({ success: false, message: error.message }); }
};