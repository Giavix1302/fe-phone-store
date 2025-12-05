import { useState, useEffect } from "react";
import { fetchProductReviews } from "../services/reviewApi";

const Review = ({ productId, initialFilters = {} }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState(null);
  const [reviewsSummary, setReviewsSummary] = useState(null);
  const [filters, setFilters] = useState({
    page: initialFilters.page || 1,
    limit: initialFilters.limit || 10,
    rating: initialFilters.rating || null,
    sort_by: initialFilters.sort_by || "created_at",
    sort_order: initialFilters.sort_order || "desc",
  });

  useEffect(() => {
    const loadReviews = async () => {
      if (!productId) return;

      setLoading(true);
      setError("");
      try {
        const data = await fetchProductReviews(productId, filters);
        if (data) {
          setReviews(data.reviews || []);
          setPagination(data.pagination || null);
          setReviewsSummary(data.reviewsSummary || null);
        }
      } catch (err) {
        setError(err.message || "Không thể tải đánh giá.");
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [productId, filters.page, filters.limit, filters.rating, filters.sort_by, filters.sort_order]);

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleRatingFilter = (rating) => {
    setFilters((prev) => ({
      ...prev,
      rating: prev.rating === rating ? null : rating,
      page: 1,
    }));
  };

  const handleSortChange = (sortBy, sortOrder) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: sortBy,
      sort_order: sortOrder,
      page: 1,
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const renderStars = (rating) => {
    return "⭐".repeat(rating || 0);
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="text-center">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-gray-600">Đang tải đánh giá...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Reviews Summary */}
      {reviewsSummary && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Đánh giá sản phẩm</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl font-bold">
              {reviewsSummary.averageRating?.toFixed(1) || "0.0"}
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                {renderStars(Math.round(reviewsSummary.averageRating || 0))}
              </div>
              <p className="text-gray-600">
                {reviewsSummary.totalReviews || 0} đánh giá
              </p>
            </div>
          </div>

          {/* Rating Breakdown */}
          {reviewsSummary.ratingBreakdown && (
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviewsSummary.ratingBreakdown[star] || 0;
                const percentage =
                  reviewsSummary.totalReviews > 0
                    ? (count / reviewsSummary.totalReviews) * 100
                    : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <button
                      onClick={() => handleRatingFilter(star)}
                      className={`text-sm ${
                        filters.rating === star
                          ? "font-bold text-blue-600"
                          : "text-gray-600 hover:text-blue-600"
                      }`}
                    >
                      {star} sao
                    </button>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Sắp xếp:</label>
          <select
            value={`${filters.sort_by}_${filters.sort_order}`}
            onChange={(e) => {
              const value = e.target.value;
              const parts = value.split("_");
              if (parts.length >= 2) {
                const sortBy = parts.slice(0, -1).join("_"); 
                const sortOrder = parts[parts.length - 1]; 
                handleSortChange(sortBy, sortOrder);
              }
            }}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="created_at_desc">Mới nhất</option>
            <option value="created_at_asc">Cũ nhất</option>
            <option value="rating_desc">Đánh giá cao nhất</option>
            <option value="rating_asc">Đánh giá thấp nhất</option>
          </select>
        </div>

        {filters.rating && (
          <button
            onClick={() => handleRatingFilter(null)}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
          >
            Xóa bộ lọc ({filters.rating} sao)
          </button>
        )}
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-gray-600">Chưa có đánh giá nào cho sản phẩm này.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                    {review.user?.avatar ? (
                      <img
                        src={review.user.avatar}
                        alt={review.user.fullName || "User"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-blue-600 font-semibold">
                        {(review.user?.fullName || "U")[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {review.user?.fullName || "Người dùng"}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {renderStars(review.rating)}
                      </div>
                      {review.isVerifiedPurchase && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                          Đã mua hàng
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(review.createdAt)}
                </span>
              </div>

              {review.comment && (
                <p className="text-gray-700 leading-relaxed mt-3">
                  {review.comment}
                </p>
              )}

              {review.updatedAt && review.updatedAt !== review.createdAt && (
                <p className="text-xs text-gray-400 mt-2">
                  Đã chỉnh sửa vào {formatDate(review.updatedAt)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrev}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Trước
          </button>
          <span className="px-4 py-2 text-gray-700">
            Trang {pagination.currentPage} / {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNext}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default Review;

