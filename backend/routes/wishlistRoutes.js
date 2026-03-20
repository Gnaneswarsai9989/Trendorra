const express = require('express');
const router = express.Router();
const { getWishlist, toggleWishlist } = require('../controllers/mainControllers');
const { protect } = require('../middleware/auth');

router.get('/', protect, getWishlist);
router.post('/', protect, toggleWishlist);

module.exports = router;
