import { useState, useEffect } from "react";
import { submitOrderReview } from "../services/reviewApi";

const OrderReviewModal = ({ isOpen, onClose, order, onSuccess }) => {
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [reviews, setReviews] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && order?.items) {
      const initialReviews = {};
      order.items.forEach((item) => {
        if (item.product?.id) {
          initialReviews[item.product.id] = {
            rating: 0,
            comment: "",
          };
        }
      });
      setReviews(initialReviews);
      setSelectedProducts(new Set());
      setErrors({});
    }
  }, [isOpen, order]);

  const handleProductToggle = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
      setReviews((prev) => ({
        ...prev,
        [productId]: { rating: 0, comment: "" },
      }));
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[productId];
        return newErrors;
      });
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleRatingChange = (productId, rating) => {
    setReviews((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], rating },
    }));
    if (errors[productId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[productId];
        return newErrors;
      });
    }
  };

  const handleCommentChange = (productId, comment) => {
    setReviews((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], comment },
    }));
    if (errors[productId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[productId];
        return newErrors;
      });
    }
  };

  const validateReviews = () => {
    const newErrors = {};
    let isValid = true;

    if (selectedProducts.size === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm để đánh giá.");
      return false;
    }

    selectedProducts.forEach((productId) => {
      const review = reviews[productId];
      if (!review) {
        newErrors[productId] = "Vui lòng nhập đánh giá cho sản phẩm này.";
        isValid = false;
      } else {
        if (!review.rating || review.rating < 1 || review.rating > 5) {
          newErrors[productId] = "Vui lòng chọn số sao đánh giá (1-5 sao).";
          isValid = false;
        }
        if (!review.comment || review.comment.trim().length < 10) {
          newErrors[productId] = "Vui lòng nhập bình luận (tối thiểu 10 ký tự).";
          isValid = false;
        } else if (review.comment.trim().length > 2000) {
          newErrors[productId] = "Bình luận không được vượt quá 2000 ký tự.";
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateReviews()) {
      return;
    }

    setSubmitting(true);
    try {
      const reviewPayload = {
        reviews: Array.from(selectedProducts).map((productId) => ({
          product_id: productId,
          rating: reviews[productId].rating,
          comment: reviews[productId].comment.trim(),
        })),
      };

      await submitOrderReview(order.order_number, reviewPayload);
      alert("Đánh giá thành công!");
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      alert(err.message || "Không thể gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (productId, currentRating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(productId, star)}
            className={`text-2xl transition ${
              star <= currentRating
                ? "text-yellow-400"
                : "text-gray-300 hover:text-yellow-200"
            }`}
            disabled={submitting}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Đánh giá sản phẩm
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Mã đơn: {order.order_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            disabled={submitting}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-gray-600 mb-4">
            Chọn sản phẩm bạn muốn đánh giá và chia sẻ trải nghiệm của bạn:
          </p>

          <div className="space-y-4">
            {order.items && order.items.length > 0 ? (
              (() => {
                const unreviewedItems = order.items.filter(
                  (item) => item.product?.id && !item.is_reviewed
                );

                if (unreviewedItems.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <p className="text-gray-600 font-medium">
                        Tất cả sản phẩm trong đơn hàng đã được đánh giá.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Cảm ơn bạn đã chia sẻ trải nghiệm!
                      </p>
                    </div>
                  );
                }

                return unreviewedItems.map((item) => {
                  const productId = item.product?.id;
                  if (!productId) return null;

                  const isSelected = selectedProducts.has(productId);
                  const review = reviews[productId] || { rating: 0, comment: "" };
                  const error = errors[productId];

                return (
                  <div
                    key={item.id}
                    className={`border-2 rounded-lg p-4 transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleProductToggle(productId)}
                        className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={submitting}
                      />

                      {/* Product Image */}
                      {item.product?.image && (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}

                      {/* Product Info */}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">
                          {item.product?.name || "Sản phẩm"}
                        </h4>
                        {item.color_name && (
                          <p className="text-sm text-gray-600">
                            Màu: {item.color_name}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          Số lượng: {item.quantity}
                        </p>

                        {/* Review Form (only show if selected) */}
                        {isSelected && (
                          <div className="mt-4 space-y-3">
                            {/* Rating */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Đánh giá của bạn <span className="text-red-500">*</span>
                              </label>
                              {renderStars(productId, review.rating)}
                              {error && error.includes("sao") && (
                                <p className="text-red-500 text-sm mt-1">{error}</p>
                              )}
                            </div>

                            {/* Comment */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bình luận <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                value={review.comment}
                                onChange={(e) =>
                                  handleCommentChange(productId, e.target.value)
                                }
                                rows={4}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                  error && error.includes("bình luận")
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                }`}
                                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này (tối thiểu 10 ký tự)..."
                                disabled={submitting}
                              />
                              <div className="flex items-center justify-between mt-1">
                                {error && error.includes("bình luận") && (
                                  <p className="text-red-500 text-sm">{error}</p>
                                )}
                                <p
                                  className={`text-xs ml-auto ${
                                    review.comment.length > 2000
                                      ? "text-red-500"
                                      : review.comment.length < 10
                                      ? "text-gray-500"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {review.comment.length} / 2000 ký tự
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
                });
              })()
            ) : (
              <p className="text-gray-500 text-center py-8">
                Không có sản phẩm nào trong đơn hàng.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            disabled={submitting}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedProducts.size === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {submitting ? "Đang gửi..." : `Gửi đánh giá (${selectedProducts.size})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderReviewModal;
