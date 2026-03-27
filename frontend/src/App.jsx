import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Customer Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import WishlistPage from './pages/WishlistPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import NotFoundPage from './pages/NotFoundPage';
import ReturnRequestPage from './pages/ReturnRequestPage';   // ← NEW

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminSellers from './pages/admin/AdminSellers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminReturns from './pages/admin/AdminReturns';  // ← NEW

// Seller Pages
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProductForm from './pages/seller/SellerProductForm';
import SellerRegisterPage from './pages/seller/SellerRegisterPage';

// Legal Pages
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import RefundPolicy from './pages/legal/RefundPolicy';
import ShippingPolicy from './pages/legal/ShippingPolicy';
import CookiePolicy from './pages/legal/CookiePolicy';
import Disclaimer from './pages/legal/Disclaimer';
import { SizeGuide, FAQ, ContactUs, TrackOrder } from './pages/legal/HelpPages';

// ── Route Guards ──────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null;
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isLoggedIn, isAdmin, loading } = useAuth();
  if (loading) return (
    <div style={{ backgroundColor: '#111', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#C9A84C', fontFamily: 'serif', letterSpacing: '0.3em' }}>Loading...</div>
    </div>
  );
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

const SellerRoute = ({ children }) => {
  const { isLoggedIn, user, loading } = useAuth();
  if (loading) return (
    <div style={{ backgroundColor: '#111', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#C9A84C', fontFamily: 'serif', letterSpacing: '0.3em' }}>Loading...</div>
    </div>
  );
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (user?.role !== 'seller' && user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

// ── Scroll to top ─────────────────────────────────────────────────
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

// ── Pages that show Navbar + Footer ──────────────────────────────
const FULL_LAYOUT_ROUTES = [
  '/', '/shop', '/cart', '/login', '/register', '/forgot-password',
  '/profile', '/wishlist', '/orders', '/checkout',
  '/privacy-policy', '/terms-of-service', '/refund-policy',
  '/shipping-policy', '/cookie-policy', '/disclaimer',
  '/size-guide', '/faq', '/contact', '/track-order',
  '/seller-register', '/seller/register',
];

// Routes that get a full-screen layout (no Navbar/Footer)
const DASHBOARD_ROUTES = ['/seller', '/admin'];
const isDashboardRoute = (path) =>
  DASHBOARD_ROUTES.some(r => path === r || path.startsWith(r + '/'));

const AppContent = () => {
  const { pathname } = useLocation();
  const fullScreen = isDashboardRoute(pathname);
  return (
    <>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#111111' }}>
        {!fullScreen && <Navbar />}
        <main className="flex-1" style={{ backgroundColor: '#111111' }}>
          <Routes>
            {/* ── Customer Routes ── */}
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/shop/:category" element={<ShopPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
            <Route path="/orders/:id/return" element={<ProtectedRoute><ReturnRequestPage /></ProtectedRoute>} />  {/* ← NEW */}
            <Route path="/order-confirmation/:id" element={<ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>} />

            {/* ── Admin Routes ── */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
            <Route path="/admin/products/new" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
            <Route path="/admin/products/:id/edit" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
            <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
            <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
            <Route path="/admin/sellers" element={<AdminRoute><AdminSellers /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
            <Route path="/admin/returns" element={<AdminRoute><AdminReturns /></AdminRoute>} />  {/* ← NEW */}

            {/* ── Seller Routes ── */}
            <Route path="/seller" element={<SellerRoute><SellerDashboard /></SellerRoute>} />
            <Route path="/seller/dashboard" element={<SellerRoute><SellerDashboard /></SellerRoute>} />
            <Route path="/seller/products/new" element={<SellerRoute><SellerProductForm /></SellerRoute>} />
            <Route path="/seller/products/:id/edit" element={<SellerRoute><SellerProductForm /></SellerRoute>} />
            <Route path="/seller-register" element={<SellerRegisterPage />} />
            <Route path="/seller/register" element={<SellerRegisterPage />} />

            {/* ── Legal Pages ── */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/size-guide" element={<SizeGuide />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/track-order" element={<TrackOrder />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        {!fullScreen && <Footer />}
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontFamily: 'Jost, sans-serif', fontSize: '13px', borderRadius: '8px', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
          success: { duration: 3000, iconTheme: { primary: '#C9A84C', secondary: '#fff' } },
          error: { duration: 5000, style: { backgroundColor: '#1a1a1a', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' } },
        }}
      />
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Router>
              <AppContent />
            </Router>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}