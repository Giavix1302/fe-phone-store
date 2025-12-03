import { parseStoredUser } from "../services/authApi";

const AdminDashboard = () => {
  const user = parseStoredUser();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-4">Trang quản trị</h1>
      <p className="text-gray-600 mb-6">
        Chỉ tài khoản có quyền <span className="font-semibold">ADMIN</span> mới
        có thể truy cập trang này.
      </p>

      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <p>
          Xin chào,{" "}
          <span className="font-semibold">
            {user?.full_name || user?.username || user?.email}
          </span>
          !
        </p>
        <p className="text-sm text-gray-500">
          Đây là nơi bạn có thể quản lý sản phẩm, đơn hàng, người dùng,...
          (hãy thêm các chức năng chi tiết tại đây sau này).
        </p>

        <div className="grid gap-4 md:grid-cols-3 mt-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h2 className="font-semibold mb-1">Quản lý sản phẩm</h2>
            <p className="text-xs text-gray-600">
              Thêm / sửa / xóa sản phẩm, cập nhật giá và tồn kho.
            </p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <h2 className="font-semibold mb-1">Quản lý đơn hàng</h2>
            <p className="text-xs text-gray-600">
              Theo dõi trạng thái đơn hàng, xác nhận giao hàng.
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
            <h2 className="font-semibold mb-1">Quản lý người dùng</h2>
            <p className="text-xs text-gray-600">
              Xem danh sách tài khoản, phân quyền USER / ADMIN.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

