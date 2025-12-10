/**
 * Utility functions for managing guest cart in localStorage
 */

const GUEST_CART_KEY = "guest_cart";

/**
 * Get guest cart from localStorage
 * @returns {Array<{ product_id: number; color_id: number; quantity: number }>}
 */
export const getGuestCart = () => {
  try {
    const cart = localStorage.getItem(GUEST_CART_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
};

/**
 * Save guest cart to localStorage
 * @param {Array<{ product_id: number; color_id: number; quantity: number }>} cart
 */
export const saveGuestCart = (cart) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Error saving guest cart:", error);
  }
};

/**
 * Add item to guest cart
 * @param {{ product_id: number; color_id: number; quantity: number }} item
 */
export const addToGuestCart = (item) => {
  const cart = getGuestCart();

  const existingIndex = cart.findIndex(
    (cartItem) =>
      cartItem.product_id === item.product_id &&
      cartItem.color_id === item.color_id
  );

  if (existingIndex >= 0) {
    cart[existingIndex].quantity += item.quantity;
  } else {
    cart.push({ ...item });
  }

  saveGuestCart(cart);
  return cart;
};

/**
 * Update quantity of item in guest cart
 * @param {number} productId
 * @param {number} colorId
 * @param {number} quantity
 */
export const updateGuestCartQuantity = (productId, colorId, quantity) => {
  const cart = getGuestCart();
  const index = cart.findIndex(
    (item) => item.product_id === productId && item.color_id === colorId
  );

  if (index >= 0) {
    if (quantity <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = quantity;
    }
    saveGuestCart(cart);
  }

  return cart;
};

/**
 * Remove item from guest cart
 * @param {number} productId
 * @param {number} colorId
 */
export const removeFromGuestCart = (productId, colorId) => {
  const cart = getGuestCart();
  const filtered = cart.filter(
    (item) => !(item.product_id === productId && item.color_id === colorId)
  );
  saveGuestCart(filtered);
  return filtered;
};

/**
 * Clear guest cart
 */
export const clearGuestCart = () => {
  localStorage.removeItem(GUEST_CART_KEY);
};

/**
 * Get guest cart count
 * @returns {number}
 */
export const getGuestCartCount = () => {
  const cart = getGuestCart();
  return cart.reduce((total, item) => total + item.quantity, 0);
};
