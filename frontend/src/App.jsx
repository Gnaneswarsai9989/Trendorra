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
import LandingPage from './pages/LandingPage';
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
import ReturnRequestPage from './pages/ReturnRequestPage';

import GoogleAuthSuccess from './pages/GoogleAuthSuccess';

import NotificationPermissionModal from './components/NotificationPermissionModal';
import { onForegroundMessage } from './firebase';
import { toast } from 'react-hot-toast';

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
import AdminReturns from './pages/admin/AdminReturns';

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

// Routes that get a full-screen layout (no Navbar/Footer)
const DASHBOARD_ROUTES = ['/seller', '/admin'];
const isDashboardRoute = (path) =>
  DASHBOARD_ROUTES.some(r => path === r || path.startsWith(r + '/'));

// ── ONLY CHANGE: also hide Navbar/Footer on the landing page "/" ──
const isLandingRoute = (path) => path === '/';

const AppContent = () => {
  const { pathname } = useLocation();
  const { isLoggedIn } = useAuth();

  // Hide Navbar+Footer for dashboard routes AND the landing page
  const fullScreen = isDashboardRoute(pathname) || isLandingRoute(pathname);

  // Sync existing permission token on login
  useEffect(() => {
    if (isLoggedIn && Notification.permission === 'granted') {
      import('./firebase').then(({ requestNotificationPermission }) => {
        requestNotificationPermission().catch(() => { });
      });
    }
  }, [isLoggedIn]);

  // Focus foreground messages
  useEffect(() => {
    try {
      const unsubscribe = onForegroundMessage((payload) => {
        toast.custom((t) => (
          <div className="bg-[#1a1a1a] text-white p-4 rounded-xl border border-[rgba(255,255,255,0.1)] shadow-xl max-w-sm flex items-start space-x-3 mt-4" style={{ fontFamily: 'Jost, sans-serif' }}>
            <div className="flex-shrink-0 bg-[#C9A84C]/20 p-2 rounded-full mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[14px] text-[#C9A84C]">{payload.notification?.title || 'Trendorra'}</h4>
              <p className="text-[13px] text-gray-300 mt-1 leading-snug">{payload.notification?.body}</p>
            </div>
            <button onClick={() => toast.dismiss(t.id)} className="text-gray-500 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ), { duration: 6000 });
      });
      return () => unsubscribe();
    } catch (e) { console.error('Foreground listener error:', e) }
  }, []);

  return (
    <>
      <NotificationPermissionModal />
      <ScrollToTop />
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#111111' }}>
        {!fullScreen && <Navbar />}
        <main className="flex-1" style={{ backgroundColor: '#111111' }}>
          <Routes>
            {/* ── Customer Routes ── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<HomePage />} />
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
            <Route path="/orders/:id/return" element={<ProtectedRoute><ReturnRequestPage /></ProtectedRoute>} />
            <Route path="/order-confirmation/:id" element={<ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>} />
            <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />

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
            <Route path="/admin/returns" element={<AdminRoute><AdminReturns /></AdminRoute>} />

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