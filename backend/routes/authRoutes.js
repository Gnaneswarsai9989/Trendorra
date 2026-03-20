const express = require('express');
const router  = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');

const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  addAddress,
  forgotPassword,
  resetPassword,
  registerSeller,
  updateSellerInfo,
} = require('../controllers/authController');

// ── Google OAuth Strategy ──
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  `${process.env.BASE_URL}/api/auth/google/callback`,
},
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value });
    if (user) {
      if (!user.avatar && profile.photos[0]?.value) {
        user.avatar = profile.photos[0].value;
        await user.save();
      }
      return done(null, user);
    }
    user = await User.create({
      name:     profile.displayName,
      email:    profile.emails[0].value,
      avatar:   profile.photos[0]?.value || '',
      password: Math.random().toString(36).slice(-8) + 'Aa1!',
      googleId: profile.id,
    });
    console.log('✅ New Google user created:', user.email);
    return done(null, user);
  } catch (err) {
    console.error('❌ Google OAuth error:', err.message);
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// ── Auth Routes ──
router.post('/register',         register);
router.post('/login',            login);
router.post('/register-seller',  registerSeller);
router.get('/me',                protect, getMe);
router.put('/profile',           protect, updateProfile);
router.put('/change-password',   protect, changePassword);
router.post('/address',          protect, addAddress);
router.post('/forgot-password',  forgotPassword);
router.post('/reset-password',   resetPassword);
router.put('/seller-info',       protect, updateSellerInfo);

// ── Google OAuth Routes ──
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`,
    session: false,
  }),
  (req, res) => {
    const token = generateToken(req.user._id);
    console.log('✅ Google login success:', req.user.email);
    res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}`);
  }
);

module.exports = router;