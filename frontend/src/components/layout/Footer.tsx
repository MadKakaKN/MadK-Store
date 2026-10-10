import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-extrabold text-xl">
              <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center text-sm">
                M
              </span>
              MadK Store
            </div>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              Trải nghiệm mua sắm thiết bị công nghệ hiện đại với mô hình 3D tương tác trực tiếp.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">
              Chính sách
            </h4>
            <ul className="space-y-2 text-sm">
              <li>Chính sách bảo hành</li>
              <li>Chính sách đổi trả 7 ngày</li>
              <li>Vận chuyển & giao nhận</li>
              <li>Bảo mật thông tin</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">
              Hỗ trợ khách hàng
            </h4>
            <ul className="space-y-2 text-sm">
              <li>Hotline: 1900 xxxx (8:00 - 21:00)</li>
              <li>Email: support@madkstore.vn</li>
              <li>Phương thức thanh toán: COD, VNPay</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">
              Về dự án
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Dự án thương mại điện tử công nghệ: ASP.NET Core 8 Clean Architecture + React 18 Three Fiber.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} MadK Store. Tất cả các quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
