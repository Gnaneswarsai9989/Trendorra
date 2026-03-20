import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { wishlistAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState({ products: [] });
  const { isLoggedIn } = useAuth();

  const fetchWishlist = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await wishlistAPI.get();
      setWishlist(res.wishlist);
    } catch {}
  }, [isLoggedIn]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const toggleWishlist = async (productId) => {
    if (!isLoggedIn) { toast.error('Please login to save items'); return; }
    try {
      const res = await wishlistAPI.toggle(productId);
      setWishlist(res.wishlist);
      toast.success(res.action === 'added' ? 'Added to wishlist ❤️' : 'Removed from wishlist');
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  const isWishlisted = (productId) => {
    return wishlist.products?.some(p => (p._id || p) === productId);
  };

  const wishlistCount = wishlist.products?.length || 0;

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted, wishlistCount, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
