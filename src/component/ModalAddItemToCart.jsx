import { useState, useEffect } from "react";
import { addToCart } from "../services/cartApi";
import { emitCartChanged } from "../utils/cartEvents";

const ModalAddItemToCart = ({ isOpen, onClose, product, onSuccess }) => {
    const [selectedColor, setSelectedColor] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (product && isOpen) {
            if (product.default_color) {
                setSelectedColor(product.default_color.id);
            } else if (product.available_colors && product.available_colors.length > 0) {
                setSelectedColor(product.available_colors[0].id);
            }
            setQuantity(1);
            setError("");
        }
    }, [product, isOpen]);

    const formatPrice = (price) => {
        if (price == null) return "";
        const numeric =
            typeof price === "number" ? price : parseInt(String(price) || "0", 10) || 0;
        return numeric.toLocaleString("vi-VN") + "₫";
    };

    const getProductImage = () => {
        if (product.images && product.images.length > 0) {
            const primaryImage = product.images.find((img) => img.is_primary);
            return primaryImage?.image_url || product.images[0]?.image_url;
        }
        return product.primary_image || "";
    };

    const getAvailableColors = () => {
        if (product.available_colors && product.available_colors.length > 0) {
            return product.available_colors;
        }
        if (product.default_color) {
            return [product.default_color];
        }
        return [];
    };

    const handleQuantityChange = (newQuantity) => {
        if (newQuantity < 1) return;
        if (newQuantity > product.stock_quantity) {
            setError(`Số lượng tối đa là ${product.stock_quantity}`);
            return;
        }
        setQuantity(newQuantity);
        setError("");
    };

    const handleAddToCart = async () => {
        if (!selectedColor) {
            setError("Vui lòng chọn màu sắc");
            return;
        }

        if (quantity < 1) {
            setError("Số lượng phải lớn hơn 0");
            return;
        }

        if (quantity > product.stock_quantity) {
            setError(`Số lượng không được vượt quá ${product.stock_quantity}`);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await addToCart({
                product_id: product.id,
                color_id: selectedColor,
                quantity: quantity,
            });

            // If guest cart, show message
            if (result?.isGuest) {
                // Guest cart - item saved to localStorage
                // Show success message
            }

            emitCartChanged();

            if (onSuccess) {
                onSuccess();
            }

            setTimeout(() => {
                onClose();
                setQuantity(1);
                setError("");
            }, 500);
        } catch (err) {
            setError(err.message || "Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const availableColors = getAvailableColors();
    const currentPrice = product.discount_price ?? product.price;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div 
                className="bg-white rounded-xl shadow-2xl border-2 border-gray-200 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Thêm vào giỏ hàng</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-xl"
                        disabled={loading}
                    >
                        ×
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Hình & Tên */}
                    <div className="flex gap-4">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                            <img
                                src={getProductImage()}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base font-medium">{product.name}</h3>
                            <div className="mt-1 flex items-center gap-2">
                                <span className="text-lg font-bold text-red-600">{formatPrice(currentPrice)}</span>
                                {product.discount_price && (
                                    <span className="text-sm text-gray-400 line-through">{formatPrice(product.price)}</span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Còn lại: <span className="font-medium">{product.stock_quantity}</span> sản phẩm
                            </p>
                        </div>
                    </div>

                    {/* Chọn màu */}
                    {availableColors.length > 0 && (
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Màu sắc</label>
                            <div className="flex flex-wrap gap-2">
                                {availableColors.map((color) => (
                                    <button
                                        key={color.id}
                                        onClick={() => { setSelectedColor(color.id); setError(""); }}
                                        disabled={loading}
                                        className={`px-3 py-1 rounded-lg border transition-all ${selectedColor === color.id
                                                ? "border-blue-600 bg-blue-50"
                                                : "border-gray-300 hover:border-gray-400"
                                            } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-5 h-5 rounded-full border border-gray-300"
                                                style={{ backgroundColor: color.hex_code }}
                                            />
                                            <span className="text-xs">{color.color_name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Số lượng */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Số lượng</label>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleQuantityChange(quantity - 1)}
                                disabled={loading || quantity <= 1}
                                className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                                min="1"
                                max={product.stock_quantity}
                                disabled={loading}
                                className="w-12 text-center border rounded-lg py-1 text-sm"
                            />
                            <button
                                onClick={() => handleQuantityChange(quantity + 1)}
                                disabled={loading || quantity >= product.stock_quantity}
                                className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                            >
                                +
                            </button>
                            <span className="text-xs text-gray-500">(Tối đa: {product.stock_quantity})</span>
                        </div>
                    </div>

                    {/* Tổng tiền */}
                    <div className="p-2 bg-gray-50 rounded-lg text-sm flex justify-between font-medium">
                        <span>Tổng cộng:</span>
                        <span className="text-red-600 font-bold">{formatPrice(currentPrice * quantity)}</span>
                    </div>

                    {/* Lỗi */}
                    {error && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleAddToCart}
                            disabled={loading || !selectedColor || quantity < 1}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {loading ? "Đang thêm..." : "Thêm vào giỏ"}
                        </button>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default ModalAddItemToCart;