import React from 'react';

export const HomePage: React.FC = () => {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero section banner */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="max-w-2xl relative z-10">
          <span className="inline-block py-1 px-3 rounded-full text-xs font-semibold tracking-wider uppercase bg-brand-500/20 text-brand-300 border border-brand-500/30 mb-4">
            Thiết bị công nghệ chính hãng
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Khám phá công nghệ đỉnh cao cùng{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-300">
              MadK Store
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Hệ thống phân phối điện thoại, laptop, phụ kiện chính hãng với trải nghiệm xem mô hình 3D
            trực quan và dịch vụ bảo hành uy tín.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="button"
              className="inline-flex items-center px-6 py-3 rounded-xl font-medium text-white bg-brand-600 hover:bg-brand-500 transition-colors shadow-lg shadow-brand-600/30"
            >
              Xem sản phẩm
            </button>
            <button
              type="button"
              className="inline-flex items-center px-6 py-3 rounded-xl font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors"
            >
              Ưu đãi hôm nay
            </button>
          </div>
        </div>
      </section>

      {/* Featured Categories Placeholder */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Danh mục nổi bật</h2>
          <span className="text-sm text-brand-600 font-medium cursor-pointer hover:underline">
            Tất cả danh mục &rarr;
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {['Điện thoại', 'Laptop', 'Phụ kiện', 'Linh kiện'].map((cat) => (
            <div
              key={cat}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow text-center cursor-pointer group"
            >
              <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                📱
              </div>
              <h3 className="mt-3 font-semibold text-slate-800 text-sm sm:text-base">{cat}</h3>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
