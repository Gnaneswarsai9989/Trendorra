import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const { isLoggedIn } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await cartAPI.get();
      setCart(res.cart);
    } catch {}
  }, [isLoggedIn]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId, size, color, quantity = 1) => {
    if (!isLoggedIn) { toast.error('Please login to add to cart'); return false; }
    setLoading(true);
    try {
      const res = await cartAPI.add({ productId, size, color, quantity });
      setCart(res.cart);
      toast.success('Added to cart!');
      return true;
    } catch (err) {
      toast.error(err.message || 'Failed to add to cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const res = await cartAPI.update(itemId, { quantity });
      setCart(res.cart);
    } catch (err) {
      toast.error('Failed to update cart');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await cartAPI.remove(itemId);
      setCart(res.cart);
      toast.success('Item removed');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clear();
      setCart({ items: [] });
    } catch {}
  };

  const cartCount = cart.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
  const cartTotal = cart.items?.reduce((acc, i) => acc + (i.price || i.product?.price || 0) * i.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateQuantity, removeFromCart, clearCart, cartCount, cartTotal, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
