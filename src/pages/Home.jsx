import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 bg-dark-200/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-primary-100/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <span className="text-2xl">⚡</span>
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
                  <span>🛒</span>
                  <span>Mua ngay</span>
                </span>
              </Link>
              <button className="btn-dark text-lg px-8 py-4 transform hover:-translate-y-1 transition-all duration-300">
                <span className="flex items-center space-x-2">
                  <span>▶️</span>
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
              { number: "50K+", label: "Khách hàng tin tưởng", icon: "👥" },
              { number: "99.9%", label: "Độ hài lòng", icon: "⭐" },
              { number: "24/7", label: "Hỗ trợ khách hàng", icon: "💬" },
              { number: "1000+", label: "Sản phẩm chính hãng", icon: "📱" },
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-primary-100 mb-2">
                  {stat.number}
                </div>
                <p className="text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
            ))}
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
                icon: "🍎",
                title: "iPhone",
                desc: "Ecosystem Apple hoàn hảo",
                color: "from-gray-100 to-primary-100",
                badge: "Mới nhất",
              },
              {
                to: "/products/category/samsung",
                icon: "📱",
                title: "Samsung Galaxy",
                desc: "Công nghệ Android dẫn đầu",
                color: "from-primary-100 to-success-100",
                badge: "Bán chạy",
              },
              {
                to: "/products/category/xiaomi",
                icon: "⚡",
                title: "Xiaomi",
                desc: "Hiệu năng vượt trội, giá hợp lý",
                color: "from-success-100 to-primary-100",
                badge: "Giá tốt",
              },
            ].map((category, index) => (
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
                  <div className="text-6xl mb-6 group-hover:scale-125 transition-transform duration-300">
                    {category.icon}
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
            ))}
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
              <span className="text-gradient"> CryptoStore?</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🚚",
                title: "Giao hàng siêu tốc",
                desc: "Miễn phí giao hàng trong 2h với đơn từ 500k",
                highlight: "2 giờ",
              },
              {
                icon: "🛡️",
                title: "Bảo hành Premium",
                desc: "Bảo hành chính hãng + bảo hiểm thiết bị",
                highlight: "100% an tâm",
              },
              {
                icon: "💎",
                title: "Chất lượng đảm bảo",
                desc: "Cam kết hàng chính hãng, hoàn tiền 200% nếu fake",
                highlight: "Chính hãng 100%",
              },
            ].map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-primary group-hover:scale-110 transition-all duration-300">
                  <span className="text-3xl">{feature.icon}</span>
                </div>

                <h3 className="text-xl font-bold mb-3 text-dark-100 dark:text-gray-100">
                  {feature.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {feature.desc}
                </p>

                <span className="badge-success">{feature.highlight}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-dark py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Sẵn sàng nâng cấp điện thoại?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Khám phá ngay bộ sưu tập điện thoại cao cấp với ưu đãi đặc biệt
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products" className="btn-primary text-lg px-8 py-4">
              Xem tất cả sản phẩm
            </Link>
            <button className="border-2 border-primary-100 text-primary-100 px-8 py-4 rounded-lg hover:bg-primary-100 hover:text-dark-200 transition-all duration-200 font-semibold">
              Tư vấn miễn phí
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
