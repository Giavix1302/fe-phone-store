import { Link } from "react-router-dom";
import { useState } from "react";
import Banner from "../assets/banner.jpg";
import LocationImg from "../assets/location.png";
import SecurityImg from "../assets/security.png";
import OriginalImg from "../assets/original.png";
import { 
  Zap, 
  ShoppingCart, 
  Play, 
  Users, 
  Star, 
  MessageCircle, 
  Smartphone,
  Apple,
  Sparkles,
  Truck,
  Shield,
  Gem,
  X,
  Phone,
  Mail,
  MessageSquare
} from "lucide-react";

const Home = () => {
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Xử lý submit form ở đây
    console.log("Form submitted:", formData);
    alert("Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.");
    setShowConsultationModal(false);
    setFormData({ name: "", phone: "", email: "", message: "" });
  };

  return (
    <div>
      {/* Hero Section */}
      <section 
        className="relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${Banner})` }}
      >
        <div className="absolute inset-0 bg-dark-200/40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-primary-100/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Zap className="w-5 h-5 text-primary-100" />
              <span className="text-dark-200 font-semibold">
                Công nghệ Blockchain
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="text-white">Điện Thoại</span>
              <br />
              <span className="text-gradient-dark">Tương Lai</span>
            </h1>

            <p className="text-xl md:text-2xl mb-8 text-gray-100 max-w-3xl mx-auto leading-relaxed">
              Khám phá thế giới công nghệ với những chiếc điện thoại hàng đầu.
              <br />
              <span className="text-primary-100 font-semibold">
                Chính hãng • Bảo hành • Giao hàng nhanh
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/products"
                className="btn-primary text-lg px-8 py-4 shadow-primary hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
              >
                <span className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Mua ngay</span>
                </span>
              </Link>
              <button className="btn-dark text-lg px-8 py-4 transform hover:-translate-y-1 transition-all duration-300">
                <span className="flex items-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>Xem demo</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary-100/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-success-100/20 rounded-full blur-xl animate-pulse delay-1000"></div>
      </section>

      {/* Stats Section */}
      <section className="bg-white dark:bg-dark-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { number: "50K+", label: "Khách hàng tin tưởng", icon: Users },
              { number: "99.9%", label: "Độ hài lòng", icon: Star },
              { number: "24/7", label: "Hỗ trợ khách hàng", icon: MessageCircle },
              { number: "1000+", label: "Sản phẩm chính hãng", icon: Smartphone },
            ].map((stat, index) => {
              const IconComponent = stat.icon;
              return (
              <div key={index} className="text-center group">
                <div className="flex justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="w-12 h-12 text-primary-100" />
                </div>
                <div className="text-3xl font-bold text-primary-100 mb-2">
                  {stat.number}
                </div>
                <p className="text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="bg-gray-100 dark:bg-dark-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              <span className="text-dark-100 dark:text-gray-100">Danh mục</span>
              <span className="text-gradient"> nổi bật</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Khám phá những thương hiệu hàng đầu với công nghệ tiên tiến nhất
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                to: "/products/category/iphone",
                icon: Apple,
                title: "iPhone",
                desc: "Ecosystem Apple hoàn hảo",
                color: "from-gray-100 to-primary-100",
                badge: "Mới nhất",
              },
              {
                to: "/products/category/samsung",
                icon: Smartphone,
                title: "Samsung Galaxy",
                desc: "Công nghệ Android dẫn đầu",
                color: "from-primary-100 to-success-100",
                badge: "Bán chạy",
              },
              {
                to: "/products/category/xiaomi",
                icon: Sparkles,
                title: "Xiaomi",
                desc: "Hiệu năng vượt trội, giá hợp lý",
                color: "from-success-100 to-primary-100",
                badge: "Giá tốt",
              },
            ].map((category, index) => {
              const IconComponent = category.icon;
              return (
              <Link
                key={index}
                to={category.to}
                className="card group hover:shadow-primary hover:-translate-y-2 transition-all duration-300 relative overflow-hidden"
              >
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10 group-hover:opacity-20 transition-opacity`}
                ></div>

                {/* Badge */}
                <div className="absolute top-4 right-4">
                  <span className="badge-primary">{category.badge}</span>
                </div>

                <div className="relative text-center p-8">
                  <div className="flex justify-center mb-6 group-hover:scale-125 transition-transform duration-300">
                    <IconComponent className="w-20 h-20 text-primary-100" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-dark-100 dark:text-gray-100">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {category.desc}
                  </p>

                  <div className="inline-flex items-center space-x-2 text-primary-100 font-semibold group-hover:text-primary-400 transition-colors">
                    <span>Khám phá ngay</span>
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white dark:bg-dark-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              <span className="text-dark-100 dark:text-gray-100">
                Tại sao chọn
              </span>
              <span className="text-gradient"> PhoneStore?</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                image: LocationImg,
                title: "Giao hàng siêu tốc",
                desc: "Miễn phí giao hàng trong 2h với đơn từ 500k",
                highlight: "2 giờ",
              },
              {
                image: SecurityImg,
                title: "Bảo hành Premium",
                desc: "Bảo hành chính hãng + bảo hiểm thiết bị",
                highlight: "100% an tâm",
              },
              {
                image: OriginalImg,
                title: "Chất lượng đảm bảo",
                desc: "Cam kết hàng chính hãng, hoàn tiền 200% nếu fake",
                highlight: "Chính hãng 100%",
              },
            ].map((feature, index) => {
              return (
              <div key={index} className="text-center group">
                <div className="flex justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-20 h-20 object-contain"
                  />
                </div>

                <h3 className="text-xl font-bold mb-3 text-dark-100 dark:text-gray-100">
                  {feature.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {feature.desc}
                </p>

                <span className="badge-success">{feature.highlight}</span>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary-100/10 via-primary-100/5 to-gray-100 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-dark-100 mb-6">
            Sẵn sàng nâng cấp điện thoại?
          </h2>
          <p className="text-xl text-gray-700 mb-10 max-w-2xl mx-auto">
            Khám phá ngay bộ sưu tập điện thoại cao cấp với ưu đãi đặc biệt
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/products" 
              className="bg-primary-100 text-dark-200 text-lg px-8 py-4 rounded-lg font-semibold hover:bg-primary-100/90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Xem tất cả sản phẩm
            </Link>
            <button 
              onClick={() => setShowConsultationModal(true)}
              className="border-2 border-primary-100 text-primary-100 px-8 py-4 rounded-lg hover:bg-primary-100 hover:text-dark-200 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Tư vấn miễn phí
            </button>
          </div>
        </div>
      </section>

      {/* Consultation Modal */}
      {showConsultationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-2xl font-bold text-dark-100">Tư vấn miễn phí</h3>
              <button
                onClick={() => setShowConsultationModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <a
                  href="tel:1900123456"
                  className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-100 hover:bg-primary-100/5 transition-all"
                >
                  <div className="w-12 h-12 bg-primary-100/10 rounded-full flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary-100" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-600">Hotline</p>
                    <p className="font-semibold text-dark-100">1900 123 456</p>
                  </div>
                </a>

                <a
                  href="mailto:contact@phonestore.com"
                  className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-100 hover:bg-primary-100/5 transition-all"
                >
                  <div className="w-12 h-12 bg-primary-100/10 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary-100" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-dark-100">contact@phonestore.com</p>
                  </div>
                </a>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold mb-4 text-dark-100">Hoặc điền form bên dưới</h4>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-100 focus:outline-none transition-colors"
                      placeholder="Nhập họ và tên của bạn"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-100 focus:outline-none transition-colors"
                        placeholder="0900 123 456"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-100 focus:outline-none transition-colors"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tin nhắn
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-100 focus:outline-none transition-colors resize-none"
                      placeholder="Bạn cần tư vấn về sản phẩm nào?"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowConsultationModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-primary-100 text-dark-200 rounded-lg font-semibold hover:bg-primary-100/90 transition-colors shadow-lg"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <MessageSquare className="w-5 h-5" />
                        <span>Gửi yêu cầu</span>
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
