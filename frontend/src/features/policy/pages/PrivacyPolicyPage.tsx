import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead, { buildBreadcrumbSchema } from '../../../components/common/SEOHead';

export const PrivacyPolicyPage: React.FC = () => {
  const breadcrumbData = buildBreadcrumbSchema([
    { name: 'Trang chủ', url: '/' },
    { name: 'Chính sách bảo mật', url: '/policies/privacy' },
  ]);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <SEOHead
        title="Chính Sách Bảo Mật Thông Tin Khách Hàng"
        description="MadK Store cam kết bảo vệ dữ liệu cá nhân của khách hàng theo tiêu chuẩn an toàn bảo mật dữ liệu. Mã hóa SSL 256-bit, không chia sẻ thông tin cho bên thứ ba."
        canonicalUrl="https://madk.store/policies/privacy"
        keywords="chính sách bảo mật madk store, bảo mật dữ liệu, an toàn thanh toán, quyền riêng tư"
        structuredData={breadcrumbData}
      />

      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-brand-600 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Chính sách bảo mật</span>
      </nav>

      <header className="border-b border-slate-200 pb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 text-xs font-bold uppercase tracking-wider mb-3">
          🔒 Quyền riêng tư & Bảo mật
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Chính Sách Bảo Mật Dữ Liệu Khách Hàng
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
          MadK Store tôn trọng quyền riêng tư của bạn và cam kết bảo vệ tuyệt đối dữ liệu cá nhân theo đúng quy định pháp luật.
        </p>
      </header>

      <article className="prose prose-slate max-w-none space-y-8 text-sm sm:text-base text-slate-700 leading-relaxed">
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>1.</span> Mục Đích Thu Thập Thông Tin
          </h2>
          <p className="text-slate-600">
            Chúng tôi chỉ thu thập thông tin khách hàng nhằm phục vụ các hoạt động mua bán thiết bị công nghệ:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600">
            <li>Xử lý và bàn giao đơn đặt hàng, xuất hóa đơn tài chính và bảo hành điện tử.</li>
            <li>Thông báo cập nhật tiến độ vận chuyển đơn hàng, trạng thái xử lý đổi trả/bảo hành.</li>
            <li>Gửi thông báo ưu đãi độc quyền hoặc khảo sát chất lượng dịch vụ (khi có sự đồng ý của khách hàng).</li>
          </ul>
        </section>

        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>2.</span> Phạm Vi Thu Thập Thông Tin
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-600">
            <li>Họ và tên người nhận, số điện thoại liên lạc, địa chỉ giao hàng chi tiết.</li>
            <li>Địa chỉ email đăng ký tài khoản (để gửi mã OTP, hóa đơn điện tử và liên kết đặt lại mật khẩu).</li>
            <li>Lịch sử đơn hàng, thiết bị quan tâm và đánh giá sản phẩm.</li>
            <li><strong>Lưu ý:</strong> MadK Store không lưu trữ trực tiếp số thẻ tín dụng hoặc thông tin mật khẩu ngân hàng của khách hàng (toàn bộ giao dịch trực tuyến được điều hướng và xử lý bảo mật qua cổng VNPay/Cổng thanh toán đạt chuẩn PCI DSS).</li>
          </ul>
        </section>

        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>3.</span> Cam Kết Bảo Mật An Toàn
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-600">
            <li>Toàn bộ thông tin được truyền tải qua giao thức mã hóa HTTPS chuẩn SSL 256-bit.</li>
            <li>Tuyệt đối không bán, cho thuê, trao đổi hoặc chia sẻ thông tin khách hàng cho bất kỳ bên thứ ba nào vì mục đích thương mại.</li>
            <li>Chỉ chia sẻ thông tin tối thiểu (tên, số điện thoại, địa chỉ) cho các đơn vị vận chuyển đối tác để thực hiện việc giao hàng.</li>
          </ul>
        </section>

        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>4.</span> Quyền Lợi Của Khách Hàng Đối Với Dữ Liệu
          </h2>
          <p className="text-slate-600">
            Khách hàng có toàn quyền tra cứu, cập nhật, điều chỉnh hoặc yêu cầu xóa bỏ thông tin cá nhân của mình bằng cách:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600">
            <li>Đăng nhập vào mục <strong>Tài khoản &gt; Sổ địa chỉ</strong> trên website MadK Store để sửa đổi.</li>
            <li>Liên hệ bộ phận Chăm sóc khách hàng qua Hotline <strong>1900 8888</strong> hoặc Email <strong>support@madk.store</strong>.</li>
          </ul>
        </section>
      </article>
    </div>
  );
};

export default PrivacyPolicyPage;
