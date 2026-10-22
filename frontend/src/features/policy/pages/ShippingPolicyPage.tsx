import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead, { buildBreadcrumbSchema } from '../../../components/common/SEOHead';

export const ShippingPolicyPage: React.FC = () => {
  const breadcrumbData = buildBreadcrumbSchema([
    { name: 'Trang chủ', url: '/' },
    { name: 'Chính sách vận chuyển', url: '/policies/shipping' },
  ]);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <SEOHead
        title="Chính Sách Vận Chuyển & Giao Hàng Toàn Quốc"
        description="Thông tin biểu phí và thời gian giao hàng tại MadK Store. Miễn phí vận chuyển toàn quốc cho đơn hàng từ 1.000.000đ, hỗ trợ giao hỏa tốc 2 giờ tại nội thành."
        canonicalUrl="https://madk.store/policies/shipping"
        keywords="vận chuyển madk store, giao hàng hỏa tốc, giao hàng toàn quốc, phí vận chuyển"
        structuredData={breadcrumbData}
      />

      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-brand-600 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Chính sách vận chuyển</span>
      </nav>

      <header className="border-b border-slate-200 pb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold uppercase tracking-wider mb-3">
          🚚 Giao vận tin cậy
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Chính Sách Vận Chuyển & Giao Nhận
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
          Đảm bảo sản phẩm công nghệ giá trị cao được đóng gói kiên cố 3 lớp và vận chuyển an toàn đến tận tay quý khách.
        </p>
      </header>

      <article className="prose prose-slate max-w-none space-y-8 text-sm sm:text-base text-slate-700 leading-relaxed">
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>1.</span> Phương Thức & Biểu Phí Vận Chuyển
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Giao Hàng Tiêu Chuẩn Toàn Quốc</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  Miễn phí &ge; 1.000.000đ
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Áp dụng 63 tỉnh thành qua đối tác vận chuyển Giao Hàng Tiết Kiệm, Viettel Post hoặc VNPost.
              </p>
              <p className="text-xs font-semibold text-slate-800">
                Thời gian: 2 - 4 ngày làm việc (Ngoại thành / Tỉnh xa: 3 - 5 ngày).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Giao Hỏa Tốc 2 Giờ (Nội thành)</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200">
                  Từ 40.000đ
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Áp dụng các quận trung tâm TP. Hồ Chí Minh và Hà Nội qua dịch vụ GrabExpress / Ahamove.
              </p>
              <p className="text-xs font-semibold text-slate-800">
                Thời gian: 1 - 2 giờ kể từ khi xác nhận đơn hàng.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>2.</span> Quy Trình Đóng Gói An Toàn Thiết Bị Công Nghệ
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-600">
            <li><strong className="text-slate-900">Lớp 1:</strong> Màng bóng khí chống sốc nhiều lớp ôm sát hộp gốc sản phẩm.</li>
            <li><strong className="text-slate-900">Lớp 2:</strong> Hộp carton dập sóng 5 lớp chuyên dụng chống móp méo va đập mạnh.</li>
            <li><strong className="text-slate-900">Lớp 3:</strong> Màng co chống thấm nước và dán tem niêm phong bảo đảm có logo MadK Store.</li>
          </ul>
        </section>

        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>3.</span> Chính Sách Đồng Kiểm Khi Nhận Hàng
          </h2>
          <p className="text-slate-600">
            Quý khách được quyền yêu cầu nhân viên giao hàng cho kiểm tra ngoại quan gói hàng trước khi thanh toán hoặc ký nhận:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600">
            <li>Kiểm tra tính nguyên vẹn của tem niêm phong và vỏ hộp ngoài.</li>
            <li>Nếu thấy thùng hàng bị rách nát, thủng, móp méo nghiêm trọng hoặc có dấu hiệu bị cạy phá, quý khách vui lòng từ chối nhận hàng và gọi ngay Hotline <strong>1900 8888</strong>.</li>
          </ul>
        </section>
      </article>
    </div>
  );
};

export default ShippingPolicyPage;
