const User  = require('../models/User');
const Order = require('../models/Order');

// @desc  Get all users — supports ?role=seller filter
// @route GET /api/users
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const query = role ? { role } : {};
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get single user by ID
// @route GET /api/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update user
// @route PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete user
// @route DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Admin dashboard stats
// @route GET /api/users/dashboard-stats
exports.getDashboardStats = async (req, res) => {
  try {
    const { period = 'week' } = req.query;

    const now = new Date();
    const ranges = {
      today: new Date(new Date().setHours(0, 0, 0, 0)),
      week:  new Date(Date.now() - 6  * 24 * 60 * 60 * 1000),
      month: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
      year:  new Date(Date.now() - 364 * 24 * 60 * 60 * 1000),
    };
    const since = ranges[period] || ranges.week;

    const validOrders  = { orderStatus: { $ne: 'Cancelled' } };
    const periodFilter = { createdAt: { $gte: since }, orderStatus: { $ne: 'Cancelled' } };

    const getDayCount = (p) => ({ today: 1, week: 7, month: 30, year: 365 }[p] || 7);
    const dayCount = getDayCount(period);

    const [
      totalUsers,
      totalOrders,
      revenueData,
      periodRevenueData,
      recentOrders,
      ordersByStatus,
      periodOrders,
      topProductsRaw,
      categoryBreakdown,
      dailyDataRaw,
      cancelledCount,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Order.countDocuments(validOrders),
      Order.aggregate([
        { $match: validOrders },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      Order.aggregate([
        { $match: { ...validOrders, createdAt: { $gte: since } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('user', 'name email'),
      Order.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
      ]),
      Order.countDocuments(periodFilter),
      Order.aggregate([
        { $match: validOrders },
        { $unwind: '$orderItems' },
        {
          $group: {
            _id:       '$orderItems.product',
            name:      { $first: '$orderItems.name' },
            image:     { $first: '$orderItems.image' },
            soldCount: { $sum: '$orderItems.quantity' },
            revenue:   { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ]),
      Order.aggregate([
        { $match: validOrders },
        { $unwind: '$orderItems' },
        {
          $lookup: {
            from: 'products', localField: 'orderItems.product',
            foreignField: '_id', as: 'prod'
          }
        },
        { $unwind: { path: '$prod', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id:     '$prod.category',
            count:   { $sum: '$orderItems.quantity' },
            revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
          }
        },
        { $sort: { revenue: -1 } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: since }, orderStatus: { $ne: 'Cancelled' } } },
        {
          $group: {
            _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            orders:  { $sum: 1 },
            revenue: { $sum: '$totalPrice' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Order.countDocuments({ orderStatus: 'Cancelled' }),
    ]);

    // Build daily arrays for selected period
    const dailyOrders  = [];
    const dailyRevenue = [];
    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key   = d.toISOString().slice(0, 10);
      const found = dailyDataRaw.find(r => r._id === key);
      dailyOrders.push(found?.orders  || 0);
      dailyRevenue.push(found?.revenue || 0);
    }

    const totalRevenue  = revenueData[0]?.total       || 0;
    const periodRevenue = periodRevenueData[0]?.total  || 0;
    const weeklyRevenue = dailyRevenue.reduce((a, b) => a + b, 0);
    const topProducts   = topProductsRaw.map(p => ({ ...p, _id: p._id?.toString() }));

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalOrders,
        totalRevenue,
        periodRevenue,
        weeklyRevenue,
        periodOrders,
        cancelledCount,
        ordersByStatus,
        recentOrders,
        topProducts,
        categoryBreakdown,
        dailyOrders,
        dailyRevenue,
        period,
        dayCount,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Record a payout for a seller
// @route POST /api/users/:id/payout
exports.processPayout = async (req, res) => {
  try {
    const { id }           = req.params;
    const { amount, note } = req.body;

    const seller = await User.findById(id);
    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    if (!seller.sellerInfo.payoutHistory) seller.sellerInfo.payoutHistory = [];
    seller.sellerInfo.payoutHistory.push({
      amount:      Number(amount),
      note:        note || '',
      processedAt: new Date(),
      processedBy: req.user._id,
    });
    seller.sellerInfo.totalPaidOut = (seller.sellerInfo.totalPaidOut || 0) + Number(amount);
    await seller.save();

    console.log(`💸 Payout of ₹${amount} recorded for ${seller.email}`);
    res.json({ success: true, message: `Payout of ₹${amount} recorded for ${seller.name}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};