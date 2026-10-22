import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead, { buildBreadcrumbSchema } from '../../../components/common/SEOHead';

export const ReturnsPolicyPage: React.FC = () => {
  const breadcrumbData = buildBreadcrumbSchema([
    { name: 'Trang chủ', url: '/' },
    { name: 'Chính sách đổi trả', url: '/policies/returns' },
  ]);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <SEOHead
        title="Chính Sách Đổi Trả & Hoàn Tiền Trong 7 Ngày"
        description="Quy định đổi trả và hoàn tiền minh bạch tại MadK Store. Đổi mới miễn phí trong 7 ngày đối với sản phẩm lỗi nhà sản xuất, hoàn tiền nhanh trong 3 ngày làm việc."
        canonicalUrl="https://madk.store/policies/returns"
        keywords="đổi trả madk store, hoàn tiền, chính sách đổi trả hàng công nghệ, đổi mới 7 ngày"
        structuredData={breadcrumbData}
      />

      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-brand-600 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Chính sách đổi trả</span>
      </nav>

      <header className="border-b border-slate-200 pb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider mb-3">
          🔄 An tâm mua sắm
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Chính Sách Đổi Trả & Hoàn Tiền
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
          Cam kết bảo vệ quyền lợi tối đa của khách hàng với chính sách đổi trả minh bạch, nhanh chóng và công bằng.
        </p>
      </header>

      <article className="prose prose-slate max-w-none space-y-8 text-sm sm:text-base text-slate-700 leading-relaxed">
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>1.</span> Thời Hạn Áp Dụng Đổi Trả
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-600">
            <li>
              <strong className="text-slate-900">Đổi mới 1 - 1 trong 7 ngày đầu:</strong> Miễn phí hoàn toàn nếu sản phẩm phát sinh lỗi phần cứng từ nhà sản xuất.
            </li>
            <li>
              <strong className="text-slate-900">Từ ngày thứ 8 đến hết hạn bảo hành:</strong> Áp dụng chính sách bảo hành chính hãng theo quy định của nhà sản xuất.
            </li>
            <li>
              <strong className="text-slate-900">Đổi theo nhu cầu khách hàng:</strong> Hỗ trợ thu hồi đổi sang sản phẩm khác với mức phí khấu hao từ 10% - 15% trong vòng 7 ngày đầu nếu máy còn nguyên seal/hộp.
            </li>
          </ul>
        </section>

        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>2.</span> Điều Kiện Hàng Đổi Trả
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-600">
            <li>Còn đầy đủ hóa đơn mua hàng điện tử hoặc số điện thoại đặt hàng trong hệ thống MadK Store.</li>
            <li>Còn nguyên hộp (box), phụ kiện đi kèm (cáp, sạc, sách hướng dẫn, quà tặng kèm nếu có).</li>
            <li>Thân máy không bị trầy xước, cấn móp, nứt vỡ hoặc dính chất lỏng.</li>
            <li>Các tài khoản cá nhân (iCloud, Google, Samsung Account, mật khẩu màn hình khóa) đã được đăng xuất hoàn toàn.</li>
          </ul>
        </section>

        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>3.</span> Quy Định & Thời Gian Hoàn Tiền
          </h2>
          <p className="text-slate-600">
            Trong trường hợp sản phẩm lỗi mà hệ thống hết hàng tương đương để đổi mới, khách hàng được quyền yêu cầu hoàn tiền 100%:
          </p>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <strong className="text-slate-900 text-xs sm:text-sm block">Thanh toán tiền mặt / COD</strong>
                <span className="text-xs text-slate-500">Hoàn tiền mặt ngay tại cửa hàng hoặc chuyển khoản ngân hàng</span>
              </div>
              <span className="font-bold text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                1 - 2 ngày làm việc
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <strong className="text-slate-900 text-xs sm:text-sm block">Thanh toán qua VNPay / Thẻ ngân hàng</strong>
                <span className="text-xs text-slate-500">Hoàn trực tiếp về tài khoản/thẻ ngân hàng đã thanh toán</span>
              </div>
              <span className="font-bold text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                3 - 5 ngày làm việc
              </span>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
};

export default ReturnsPolicyPage;
