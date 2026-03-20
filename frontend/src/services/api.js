import axios from "axios";

// ✅ Use env OR fallback to deployed backend
const API = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "https://trendorra.onrender.com") + "/api",
  timeout: 15000,
});

// ── Request interceptor ───────────────────────────────────────────
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("trendora_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ─────────────────────────────────────────
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem("trendora_token");
      const isLoginRequest = error.config?.url?.includes("/auth/login");

      if (token && !isLoginRequest) {
        localStorage.removeItem("trendora_token");
        localStorage.removeItem("trendora_user");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error.response?.data || error.message);
  }
);

// ── Auth ──────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post("/auth/register", data),
  login: (data) => API.post("/auth/login", data),
  registerSeller: (data) => API.post("/auth/register-seller", data),
  getMe: () => API.get("/auth/me"),
  updateProfile: (data) => API.put("/auth/profile", data),
  changePassword: (data) => API.put("/auth/change-password", data),
  addAddress: (data) => API.post("/auth/address", data),
  forgotPassword: (data) => API.post("/auth/forgot-password", data),
  resetPassword: (data) => API.post("/auth/reset-password", data),
  updateSellerInfo: (data) => API.put("/auth/seller-info", data),
};

// ── Products ──────────────────────────────────────────────────────
export const productAPI = {
  getAll: (params) => API.get("/products", { params }),
  getById: (id) => API.get(`/products/${id}`),
  getFeatured: () => API.get("/products/featured"),
  getMine: () => API.get("/products/mine"),
  create: (data) => API.post("/products", data),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
};

// ── Cart ──────────────────────────────────────────────────────────
export const cartAPI = {
  get: () => API.get("/cart"),
  add: (data) => API.post("/cart", data),
  update: (itemId, data) => API.put(`/cart/${itemId}`, data),
  remove: (itemId) => API.delete(`/cart/${itemId}`),
  clear: () => API.delete("/cart/clear"),
};

// ── Wishlist ──────────────────────────────────────────────────────
export const wishlistAPI = {
  get: () => API.get("/wishlist"),
  toggle: (productId) => API.post("/wishlist", { productId }),
};

// ── Orders ───────────────────────────────────────────────────────
export const orderAPI = {
  create: (data) => API.post("/orders", data),
  getMyOrders: () => API.get("/orders/my-orders"),
  getById: (id) => API.get(`/orders/${id}`),
  getAll: (params) => API.get("/orders/all", { params }),
  updateStatus: (id, data) => API.put(`/orders/${id}/status`, data),
  cancel: (id) => API.put(`/orders/${id}/cancel`),
  deleteMyOrders: () => API.delete("/orders/seller/my-orders"),
};

// ── Delivery ──────────────────────────────────────────────────────
export const deliveryAPI = {
  markReady: (orderId) => API.post(`/delivery/ready/${orderId}`),
  simulate: (orderId) => API.post(`/delivery/simulate/${orderId}`),
  track: (waybill) => API.get(`/delivery/track/${waybill}`),
  cancelOrder: (orderId) => API.post(`/delivery/cancel/${orderId}`),
};

// ── Reviews ──────────────────────────────────────────────────────
export const reviewAPI = {
  create: (data) => API.post("/reviews", data),
  getByProduct: (productId) => API.get(`/reviews/${productId}`),
  delete: (id) => API.delete(`/reviews/${id}`),
  markHelpful: (id) => API.put(`/reviews/${id}/helpful`),
};

// ── Payment ──────────────────────────────────────────────────────
export const paymentAPI = {
  createRazorpayOrder: (amount) =>
    API.post("/payment/razorpay/create-order", { amount }),
  verifyRazorpay: (data) =>
    API.post("/payment/razorpay/verify", data),
  createStripeIntent: (amount) =>
    API.post("/payment/stripe/create-intent", { amount }),
};

// ── Users (Admin) ─────────────────────────────────────────────────
export const userAPI = {
  getAll: (params) => API.get("/users", { params }),
  getById: (id) => API.get(`/users/${id}`),
  update: (id, data) => API.put(`/users/${id}`, data),
  delete: (id) => API.delete(`/users/${id}`),
  getDashboardStats: (params) =>
    API.get("/users/dashboard-stats", { params }),
  deleteAllOrders: () =>
    API.delete("/orders/admin/delete-all-orders"),
  resetRevenueData: () =>
    API.put("/orders/admin/reset-revenue"),
  processPayout: (id, data) =>
    API.post(`/users/${id}/payout`, data),
};

// ── Coupons ───────────────────────────────────────────────────────
export const couponAPI = {
  apply: (data) => API.post("/coupons/apply", data),
  getAll: () => API.get("/coupons"),
  create: (data) => API.post("/coupons", data),
  delete: (id) => API.delete(`/coupons/${id}`),
};

// ── Upload ────────────────────────────────────────────────────────
export const uploadAPI = {
  uploadImage: (formData) =>
    API.post("/upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  uploadImages: (formData) =>
    API.post("/upload/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteImage: (public_id) =>
    API.delete("/upload/image", { data: { public_id } }),
};

export default API;