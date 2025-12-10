import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCart, updateQuantity, removeItem, clearCart } from "../services/cartApi";
import { emitCartChanged } from "../utils/cartEvents";
import { 
  updateGuestCartQuantity, 
  removeFromGuestCart, 
  clearGuestCart 
} from "../utils/guestCart";

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [removingItems, setRemovingItems] = useState(new Set());
  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCart();
      
      // If guest cart, fetch product details for each item
      if (data?.isGuest && data?.items) {
        const token = localStorage.getItem("token");
        if (!token) {
          // For guest cart, we'll show basic info
          // Product details will be fetched when needed or user can click to view
          setCart(data);
        } else {
          // User logged in but got guest cart - shouldn't happen, but handle it
          setCart(data);
        }
      } else {
        setCart(data);
      }
    } catch (err) {
      setError(err.message || "Không thể tải giỏ hàng. Vui lòng thử lại sau.");
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (price == null) return "0₫";
    const numeric =
      typeof price === "number" ? price : parseFloat(String(price) || "0") || 0;
    return numeric.toLocaleString("vi-VN") + "₫";
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    const item = cart?.items?.find((i) => i.id === itemId);
    if (!item) return;

    // Check if guest cart
    if (cart?.isGuest) {
      // Update guest cart
      const guestCart = updateGuestCartQuantity(
        item.product_id,
        item.color_id,
        newQuantity
      );
      setCart({
        ...cart,
        items: guestCart.map((cartItem, index) => ({
          id: `guest-${index}`,
          product_id: cartItem.product_id,
          color_id: cartItem.color_id,
          quantity: cartItem.quantity,
        })),
        total_items: guestCart.length,
        total_quantity: guestCart.reduce((sum, item) => sum + item.quantity, 0),
        isGuest: true,
      });
      emitCartChanged();
      return;
    }

    // Authenticated cart
    if (newQuantity > item.product.stock_quantity) {
      setError(`Số lượng tối đa là ${item.product.stock_quantity}`);
      return;
    }

    setUpdatingItems((prev) => new Set(prev).add(itemId));
    setError("");

    try {
      await updateQuantity(itemId, newQuantity);
      await loadCart();
      emitCartChanged();
    } catch (err) {
      setError(err.message || "Không thể cập nhật số lượng. Vui lòng thử lại.");
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")) {
      return;
    }

    const item = cart?.items?.find((i) => i.id === itemId);
    if (!item) return;

    // Check if guest cart
    if (cart?.isGuest) {
      // Remove from guest cart
      const guestCart = removeFromGuestCart(item.product_id, item.color_id);
      setCart({
        ...cart,
        items: guestCart.map((cartItem, index) => ({
          id: `guest-${index}`,
          product_id: cartItem.product_id,
          color_id: cartItem.color_id,
          quantity: cartItem.quantity,
        })),
        total_items: guestCart.length,
        total_quantity: guestCart.reduce((sum, item) => sum + item.quantity, 0),
        isGuest: true,
      });
      emitCartChanged();
      return;
    }

    // Authenticated cart
    setRemovingItems((prev) => new Set(prev).add(itemId));
    setError("");

    try {
      await removeItem(itemId);
      await loadCart();
      emitCartChanged();
    } catch (err) {
      setError(err.message || "Không thể xóa sản phẩm. Vui lòng thử lại.");
    } finally {
      setRemovingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?")) {
      return;
    }

    setError("");
    
    // Check if guest cart
    if (cart?.isGuest) {
      clearGuestCart();
      setCart({ items: [], total_items: 0, total_quantity: 0, isGuest: true });
      emitCartChanged();
      return;
    }

    // Authenticated cart
    try {
      await clearCart();
      await loadCart();
      emitCartChanged();
    } catch (err) {
      setError(err.message || "Không thể xóa giỏ hàng. Vui lòng thử lại.");
    }
  };

  const calculateTotal = () => {
    if (!cart?.items) return 0;
    
    // Guest cart doesn't have line_total, return 0 or show message
    if (cart.isGuest) {
      return 0; // Can't calculate total without product prices
    }
    
    return cart.items.reduce((sum, item) => {
      if (selectedItems.has(item.id)) {
        const lineTotal = parseFloat(item.line_total) || 0;
        return sum + lineTotal;
      }
      return sum;
    }, 0);
  };

  const calculateSelectedQuantity = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => {
      if (selectedItems.has(item.id)) {
        return sum + (item.quantity || 0);
      }
      return sum;
    }, 0);
  };

  const handleToggleSelectItem = (itemId) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!cart?.items) return;
    const allSelected = cart.items.every((item) => selectedItems.has(item.id));
    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      const allItemIds = new Set(cart.items.map((item) => item.id));
      setSelectedItems(allItemIds);
    }
  };

  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      setError("Vui lòng chọn ít nhất một sản phẩm để thanh toán");
      return;
    }

    // Check if guest cart
    if (cart?.isGuest) {
      setError("Vui lòng đăng nhập để thanh toán");
      navigate("/login", { state: { from: { pathname: "/cart" } } });
      return;
    }

    const selectedItemIds = Array.from(selectedItems);
    navigate("/checkout", { state: { cartItemIds: selectedItemIds } });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Giỏ hàng</h1>
        <div className="flex items-center justify-center py-16">
          <div className="text-gray-500">Đang tải giỏ hàng...</div>
        </div>
      </div>
    );
  }

  if (error && !cart) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Giỏ hàng</h1>
        <div className="text-center py-16">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={loadCart}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Giỏ hàng</h1>
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold mb-2">Giỏ hàng trống</h2>
          <p className="text-gray-600 mb-4">
            Thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
          </p>
          <Link
            to="/products"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition inline-block"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Giỏ hàng</h1>
        {cart.items.length > 0 && (
          <button
            onClick={handleClearCart}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Xóa toàn bộ
          </button>
        )}
      </div>

      {/* Guest cart notice */}
      {cart.isGuest && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-800 font-medium">
                Bạn đang xem giỏ hàng tạm thời
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                Đăng nhập để lưu giỏ hàng và tiếp tục thanh toán
              </p>
            </div>
            <Link
              to="/login"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Danh sách sản phẩm */}
        <div className="lg:col-span-2 space-y-4">
          {/* Select All Checkbox */}
          <div className="bg-white border rounded-lg p-4 shadow-sm flex items-center gap-3">
            <input
              type="checkbox"
              checked={cart.items.length > 0 && cart.items.every((item) => selectedItems.has(item.id))}
              onChange={handleSelectAll}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700 cursor-pointer" onClick={handleSelectAll}>
              Chọn tất cả ({selectedItems.size}/{cart.items.length})
            </label>
          </div>

          {cart.items.map((item) => {
            const isUpdating = updatingItems.has(item.id);
            const isRemoving = removingItems.has(item.id);
            const isDisabled = isUpdating || isRemoving;
            const isGuestItem = cart.isGuest || !item.product;

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-lg p-4 shadow-sm ${
                  !item.is_available && !isGuestItem ? "opacity-60" : ""
                }`}
              >
                <div className="flex gap-4">
                  {/* Checkbox */}
                  <div className="shrink-0 pt-1">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleToggleSelectItem(item.id)}
                      disabled={isGuestItem || (!item.is_available && !isGuestItem)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>

                  {/* Hình ảnh */}
                  {isGuestItem ? (
                    <div className="shrink-0">
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        <span className="text-gray-400 text-2xl">📦</span>
                      </div>
                    </div>
                  ) : (
                    <Link
                      to={`/products/${item.product.slug}`}
                      className="shrink-0"
                    >
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={item.product.primary_image || "/placeholder.jpg"}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                  )}

                  {/* Thông tin sản phẩm */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {isGuestItem ? (
                          <div>
                            <p className="text-lg font-semibold text-gray-700">
                              Sản phẩm ID: {item.product_id}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Vui lòng đăng nhập để xem chi tiết sản phẩm
                            </p>
                          </div>
                        ) : (
                          <Link
                            to={`/products/${item.product.slug}`}
                            className="text-lg font-semibold hover:text-blue-600 transition"
                          >
                            {item.product.name}
                          </Link>
                        )}

                        {/* Màu sắc */}
                        {!isGuestItem && item.color && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm text-gray-600">Màu:</span>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-5 h-5 rounded-full border border-gray-300"
                                style={{ backgroundColor: item.color.hex_code }}
                              />
                              <span className="text-sm text-gray-700">
                                {item.color.color_name}
                              </span>
                            </div>
                          </div>
                        )}

                        {isGuestItem && (
                          <div className="mt-2">
                            <span className="text-sm text-gray-600">
                              Màu ID: {item.color_id}
                            </span>
                          </div>
                        )}

                        {/* Giá */}
                        {!isGuestItem && (
                          <div className="mt-2">
                            <span className="text-lg font-bold text-red-600">
                              {formatPrice(item.unit_price)}
                            </span>
                          </div>
                        )}

                        {/* Trạng thái */}
                        {!isGuestItem && !item.is_available && (
                          <div className="mt-2">
                            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                              {item.stock_status || "Không còn hàng"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Nút xóa */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isDisabled}
                        className="text-gray-400 hover:text-red-600 transition p-1 disabled:opacity-50"
                        title="Xóa sản phẩm"
                      >
                        {isRemoving ? (
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Số lượng và tổng tiền */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Số lượng:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity - 1)
                            }
                            disabled={isDisabled || item.quantity <= 1}
                            className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 1;
                              handleQuantityChange(item.id, newQty);
                            }}
                            min="1"
                            max={isGuestItem ? 999 : item.product?.stock_quantity}
                            disabled={isDisabled}
                            className="w-16 text-center border rounded-lg py-1 text-sm disabled:opacity-50"
                          />
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity + 1)
                            }
                            disabled={
                              isDisabled ||
                              (!isGuestItem && item.quantity >= item.product?.stock_quantity)
                            }
                            className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                        {isUpdating && (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin ml-2" />
                        )}
                      </div>

                      <div className="text-right">
                        {isGuestItem ? (
                          <div className="text-sm text-gray-500">
                            Đăng nhập để xem giá
                          </div>
                        ) : (
                          <>
                            <div className="text-sm text-gray-600">Thành tiền:</div>
                            <div className="text-lg font-bold text-red-600">
                              {formatPrice(item.line_total)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tóm tắt đơn hàng */}
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-lg p-6 shadow-sm sticky top-4">
            <h2 className="text-xl font-bold mb-4">Tóm tắt đơn hàng</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sản phẩm đã chọn:</span>
                <span className="font-medium">{selectedItems.size}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Số lượng đã chọn:</span>
                <span className="font-medium">{calculateSelectedQuantity()}</span>
              </div>
            </div>

            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Tổng cộng:</span>
                <span className="text-2xl font-bold text-red-600">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {cart.has_unavailable_items && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">
                ⚠️ Một số sản phẩm trong giỏ hàng không còn khả dụng
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={selectedItems.size === 0}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Thanh toán ({selectedItems.size})
            </button>

            <Link
              to="/products"
              className="block w-full text-center border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
export { Cart };