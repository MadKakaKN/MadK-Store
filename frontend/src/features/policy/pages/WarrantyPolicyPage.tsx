import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead, { buildBreadcrumbSchema } from '../../../components/common/SEOHead';

export const WarrantyPolicyPage: React.FC = () => {
  const breadcrumbData = buildBreadcrumbSchema([
    { name: 'Trang chủ', url: '/' },
    { name: 'Chính sách bảo hành', url: '/policies/warranty' },
  ]);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <SEOHead
        title="Chính Sách Bảo Hành Chính Hãng 12-24 Tháng"
        description="Thông tin chi tiết về chính sách bảo hành thiết bị công nghệ chính hãng tại MadK Store. Cam kết 1 đổi 1 trong 30 ngày, bảo hành điện tử chính hãng toàn quốc."
        canonicalUrl="https://madk.store/policies/warranty"
        keywords="bảo hành madk store, chính sách bảo hành, bảo hành laptop, bảo hành điện thoại chính hãng"
        structuredData={breadcrumbData}
      />

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-brand-600 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Chính sách bảo hành</span>
      </nav>

      {/* Header Banner */}
      <header className="border-b border-slate-200 pb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider mb-3">
          🛡️ Cam kết chất lượng
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Chính Sách Bảo Hành Tại MadK Store
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
          Áp dụng cho tất cả các sản phẩm điện thoại, laptop, linh kiện PC và gaming gear phân phối
          chính thức bởi hệ thống MadK Store.
        </p>
      </header>

      {/* Policy Content */}
      <article className="prose prose-slate max-w-none space-y-8 text-sm sm:text-base text-slate-700 leading-relaxed">
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>1.</span> Thời Hạn & Hình Thức Bảo Hành
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-600">
            <li>
              <strong className="text-slate-900">Điện thoại thông minh & Máy tính bảng:</strong> Bảo
              hành 12 tháng chính hãng theo tiêu chuẩn của nhà sản xuất (Apple, Samsung, Asus,...).
            </li>
            <li>
              <strong className="text-slate-900">Laptop & Màn hình đồ họa:</strong> Bảo hành 12 - 24
              tháng tận nhà (on-site warranty) tùy theo quy định của từng thương hiệu.
            </li>
            <li>
              <strong className="text-slate-900">Linh kiện PC (VGA, CPU, RAM, SSD):</strong> Bảo hành
              chính hãng từ 24 - 36 tháng.
            </li>
            <li>
              <strong className="text-slate-900">Gaming Gear & Phụ kiện:</strong> Bảo hành 12 tháng, 1
              đổi 1 trong 30 ngày nếu phát sinh lỗi từ nhà sản xuất.
            </li>
          </ul>
        </section>

        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>2.</span> Điều Kiện Tiếp Nhận Bảo Hành Miễn Phí
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-600">
            <li>Sản phẩm còn trong thời hạn bảo hành tính từ ngày xuất hóa đơn điện tử hoặc kích hoạt bảo hành điện tử (e-Warranty).</li>
            <li>Tem bảo hành, số Serial Number / IMEI trên máy còn nguyên vẹn, không bị cạo sửa, tẩy xóa hoặc rách nát.</li>
            <li>Hư hỏng được xác định do lỗi kỹ thuật hoặc linh kiện từ phía nhà sản xuất.</li>
          </ul>
        </section>

        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>3.</span> Trường Hợp Từ Chối Bảo Hành Miễn Phí
          </h2>
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
            Các trường hợp sau sẽ được hỗ trợ sửa chữa dịch vụ có tính phí theo giá linh kiện hãng:
          </div>
          <ul className="list-disc pl-5 space-y-2 text-slate-600">
            <li>Sản phẩm bị rơi vỡ, cấn móp, biến dạng khung vỏ do va đập ngoại lực.</li>
            <li>Sản phẩm bị vô nước, ẩm mốc, oxi hóa hoặc có dấu hiệu côn trùng xâm nhập.</li>
            <li>Người dùng tự ý can thiệp phần cứng, tháo mở ốc vít, can thiệp firmware/BIOS không được ủy quyền.</li>
          </ul>
        </section>

        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>4.</span> Quy Trình Tiếp Nhận & Thời Gian Xử Lý
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-2xl block mb-2">📞</span>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Bước 1: Liên hệ</h3>
              <p className="text-xs text-slate-500 mt-1">Gọi Hotline 1900 8888 hoặc gửi email hỗ trợ</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-2xl block mb-2">📦</span>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Bước 2: Gửi máy</h3>
              <p className="text-xs text-slate-500 mt-1">Gửi trực tiếp showroom hoặc bưu điện miễn phí</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-2xl block mb-2">⚡</span>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Bước 3: Trả bảo hành</h3>
              <p className="text-xs text-slate-500 mt-1">Xử lý trong 3 - 7 ngày làm việc</p>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
};

export default WarrantyPolicyPage;
