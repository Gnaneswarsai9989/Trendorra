import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
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
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import { AdminOrders, AdminUsers } from './pages/admin/AdminOrders';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminSellers from './pages/admin/AdminSellers';
import NotFoundPage from './pages/NotFoundPage';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import { default as TermsOfService } from './pages/legal/TermsOfService';
import RefundPolicy from './pages/legal/RefundPolicy';
import ShippingPolicy from './pages/legal/ShippingPolicy';
import CookiePolicy from './pages/legal/CookiePolicy';
import Disclaimer from './pages/legal/Disclaimer';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import SellerRegisterPage from './pages/seller/SellerRegisterPage';
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProductForm from './pages/seller/SellerProductForm';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [pathname]);
  return null;
}

// ── Route guards ──────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};
const AdminRoute = ({ children }) => {
  const { isLoggedIn, isAdmin } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isAdmin)    return <Navigate to="/" replace />;
  return children;
};
const SellerRoute = ({ children }) => {
  const { isLoggedIn, user } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (user?.role !== 'seller' && user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

// ── Layout wrapper — hides Navbar+Footer on admin/seller pages ────
function Layout({ children }) {
  const { pathname } = useLocation();
  // Any path starting with /admin or /seller hides the main website nav
  const isPanel = pathname.startsWith('/admin') || pathname.startsWith('/seller');
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#111111' }}>
      {!isPanel && <Navbar />}
      <main className="flex-1" style={{ backgroundColor: '#111111' }}>
        {children}
      </main>
      {!isPanel && <Footer />}
    </div>
  );
}

const AppContent = () => {
  return (
    <Router>
      <ScrollToTop />
      <Layout>
        <Routes>

          {/* ── Public ── */}
          <Route path="/"               element={<HomePage />} />
          <Route path="/shop"           element={<ShopPage />} />
          <Route path="/shop/:category" element={<ShopPage />} />
          <Route path="/product/:id"    element={<ProductDetailPage />} />
          <Route path="/cart"           element={<CartPage />} />
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/register"       element={<RegisterPage />} />

          {/* ── Google Auth ── */}
          <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />

          {/* ── Protected ── */}
          <Route path="/checkout"               element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/profile"                element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/wishlist"               element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
          <Route path="/orders"                 element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:id"             element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
          <Route path="/order-confirmation/:id" element={<ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>} />

          {/* ── Admin ── */}
          <Route path="/admin"                   element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/products"          element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/products/new"      element={<AdminRoute><AdminProductForm /></AdminRoute>} />
          <Route path="/admin/products/:id/edit" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
          <Route path="/admin/orders"            element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="/admin/users"             element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/analytics"         element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
          <Route path="/admin/notifications"     element={<AdminRoute><AdminNotifications /></AdminRoute>} />
          <Route path="/admin/coupons"           element={<AdminRoute><AdminCoupons /></AdminRoute>} />
          <Route path="/admin/sellers"           element={<AdminRoute><AdminSellers /></AdminRoute>} />

          {/* ── Seller ── */}
          <Route path="/seller/register"         element={<SellerRegisterPage />} />
          <Route path="/seller/dashboard"        element={<SellerRoute><SellerDashboard /></SellerRoute>} />
          <Route path="/seller/products/new"     element={<SellerRoute><SellerProductForm /></SellerRoute>} />
          <Route path="/seller/products/:id/edit" element={<SellerRoute><SellerProductForm /></SellerRoute>} />

          {/* ── Legal ── */}
          <Route path="/privacy-policy"          element={<PrivacyPolicy />} />
          <Route path="/legal/privacy-policy"    element={<PrivacyPolicy />} />
          <Route path="/terms-of-service"        element={<TermsOfService />} />
          <Route path="/legal/terms-of-service"  element={<TermsOfService />} />
          <Route path="/refund-policy"           element={<RefundPolicy />} />
          <Route path="/legal/refund-policy"     element={<RefundPolicy />} />
          <Route path="/shipping-policy"         element={<ShippingPolicy />} />
          <Route path="/legal/shipping-policy"   element={<ShippingPolicy />} />
          <Route path="/cookie-policy"           element={<CookiePolicy />} />
          <Route path="/legal/cookie-policy"     element={<CookiePolicy />} />
          <Route path="/disclaimer"              element={<Disclaimer />} />
          <Route path="/legal/disclaimer"        element={<Disclaimer />} />

          {/* ── 404 ── */}
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </Layout>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontFamily: 'Jost, sans-serif', fontSize: '14px', borderRadius: '0', border: '1px solid #e5e5e5' },
          success: { iconTheme: { primary: '#C9A84C', secondary: '#fff' } },
        }}
      />
    </Router>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppContent />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}