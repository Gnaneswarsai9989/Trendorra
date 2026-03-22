const Product = require('../models/Product');

// @desc  Get all products with filters
// @route GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const {
      search, category, subCategory, brand,
      minPrice, maxPrice, size, color, sort,
      page = 1, limit = 12,
      featured, newArrival, bestSeller,
    } = req.query;

    const query = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name:        searchRegex },
        { description: searchRegex },
        { brand:       searchRegex },
        { category:    searchRegex },
        { subCategory: searchRegex },
        { material:    searchRegex },
        { tags:        searchRegex },
      ];
    }

    if (category)    query.category    = category;
    if (subCategory) query.subCategory = subCategory;
    if (brand) query.brand = { $in: brand.split(',') };

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (size)  query.sizes          = { $in: size.split(',') };
    if (color) query['colors.name'] = { $in: color.split(',') };

    if (featured    === 'true') query.isFeatured   = true;
    if (newArrival  === 'true') query.isNewArrival  = true;
    if (bestSeller  === 'true') query.isBestSeller  = true;

    const sortOptions = {
      'price-asc':  { price: 1 },
      'price-desc': { price: -1 },
      'rating':     { ratings: -1 },
      'newest':     { createdAt: -1 },
      'popular':    { numReviews: -1 },
    };
    const sortBy = sortOptions[sort] || { createdAt: -1 };

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('createdBy', 'name role email') // ← populate seller info
      .sort(sortBy)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      products,
      pagination: {
        page:  Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get single product
// @route GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name role email');
    if (!product)
      return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Create product (Admin / Seller)
// @route POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update product (Admin / Seller)
// @route PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!product)
      return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete product (Admin)
// @route DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get featured / new arrivals / best sellers
// @route GET /api/products/featured
exports.getFeaturedProducts = async (req, res) => {
  try {
    const [featured, newArrivals, bestSellers] = await Promise.all([
      Product.find({ isFeatured:   true }).limit(8),
      Product.find({ isNewArrival: true }).sort({ createdAt: -1 }).limit(8),
      Product.find({ isBestSeller: true }).limit(8),
    ]);
    res.json({ success: true, featured, newArrivals, bestSellers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};