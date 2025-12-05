// Cart.jsx
import { Link } from "react-router-dom";

const Cart = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
};

export default Cart;
export { Cart };
