export const CART_CHANGED_EVENT = "cart-changed";

export const emitCartChanged = () => {
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
};

