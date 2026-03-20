const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const dotenv     = require('dotenv');
const session    = require('express-session');
const passport   = require('passport');
const connectDB  = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// ── Security middleware ───────────────────────────────────────────
app.use(helmet());
app.use(morgan('dev'));

// ── Trust proxy (required for Render/Vercel) ──────────────────────
app.set('trust proxy', 1);

// ── Rate limiting ─────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 500 : 0,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// ── CORS ──────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://trendorra.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Session (required for passport) ──────────────────────────────
app.use(session({
  secret:            process.env.SESSION_SECRET || 'trendorra_secret',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:   process.env.NODE_ENV === 'production', // true on Render (HTTPS)
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' required for cross-domain
    httpOnly: true,
    maxAge:   24 * 60 * 60 * 1000, // 1 day
  },
}));

// ── Passport ──────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/products',      require('./routes/productRoutes'));
app.use('/api/reviews',       require('./routes/reviewRoutes'));
app.use('/api/cart',          require('./routes/cartRoutes'));
app.use('/api/wishlist',      require('./routes/wishlistRoutes'));
app.use('/api/orders',        require('./routes/orderRoutes'));
app.use('/api/users',         require('./routes/userRoutes'));
app.use('/api/payment',       require('./routes/paymentRoutes'));
app.use('/api/coupons',       require('./routes/couponRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/upload',        require('./routes/uploadRoutes'));
app.use('/api/delivery',      require('./routes/deliveryRoutes'));

// ── Health check ──────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Trendorra API is running!', status: 'OK' });
});

// ── Global error handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Start server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Trendorra server running on port ${PORT}`);
});