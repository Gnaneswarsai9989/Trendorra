const express = require('express');
const router  = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats,
  processPayout,
  clearPayoutHistory,
  toggleNoReturnsApproval,
} = require('../controllers/userController');

const { protect, admin } = require('../middleware/auth');

router.get('/dashboard-stats',              protect, admin, getDashboardStats);
router.get('/',                             protect, admin, getAllUsers);
router.get('/:id',                          protect, admin, getUserById);
router.put('/:id',                          protect, admin, updateUser);
router.delete('/:id',                       protect, admin, deleteUser);
router.post('/:id/payout',                  protect, admin, processPayout);
router.delete('/:id/payout-history',        protect, admin, clearPayoutHistory);
router.patch('/:id/no-returns-approval',    protect, admin, toggleNoReturnsApproval);

module.exports = router;