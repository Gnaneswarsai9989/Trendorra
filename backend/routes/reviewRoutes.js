// reviewRoutes.js
const express = require('express');
const router = express.Router();
const { createReview, getProductReviews, deleteReview } = require('../controllers/mainControllers');
const { protect, admin } = require('../middleware/auth');

router.post('/', protect, createReview);
router.get('/:productId', getProductReviews);
router.delete('/:id', protect, deleteReview);

module.exports = router;
