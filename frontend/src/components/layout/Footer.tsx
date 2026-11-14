import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#111827] border-t border-[#374151] text-gray-300 mt-10 py-10 pb-20 sm:pb-10">
      <div className="max-w-[1240px] mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-xs">
          {/* Col 1: Về MadK Store */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#1D4ED8] rounded flex items-center justify-center text-white font-bold text-sm">
                M
              </div>
              <span className="font-bold text-base text-white">MadK Store</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Hệ thống bán lẻ thiết bị số, laptop gaming, máy tính PC và linh kiện công nghệ chính hãng hàng đầu Việt Nam. Tích hợp trải nghiệm tương tác 3D 360° trực quan.
            </p>
            <div className="space-y-1.5 text-gray-300 pt-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-gray-400">storefront</span>
                <span>Hệ thống 45 showroom toàn quốc</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-gray-400">call</span>
                <span>Hotline: <strong className="text-white font-semibold">1800 6868</strong> (Miễn phí 8h00 - 21h30)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-gray-400">mail</span>
                <span>Email: support@madkstore.vn</span>
              </div>
            </div>
          </div>

          {/* Col 2: Chính sách */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-white">Chính sách bán hàng</h4>
            <ul className="space-y-2 text-gray-400 text-xs">
              <li>
                <Link to="/policies/warranty" className="hover:text-white transition-colors">
                  Chính sách bảo hành chính hãng 24 tháng
                </Link>
              </li>
              <li>
                <Link to="/policies/returns" className="hover:text-white transition-colors">
                  Chính sách đổi mới 1 - 1 trong 30 ngày
                </Link>
              </li>
              <li>
                <Link to="/policies/shipping" className="hover:text-white transition-colors">
                  Giao hàng hỏa tốc nội thành qua GHN 2h
                </Link>
              </li>
              <li>
                <Link to="/policies/privacy" className="hover:text-white transition-colors">
                  Chính sách bảo mật thông tin khách hàng
                </Link>
              </li>
              <li>
                <Link to="/tracking" className="text-blue-400 hover:text-blue-300 transition-colors font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">receipt_long</span>
                  <span>Tra cứu đơn hàng & Bảo hành điện tử</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Hỗ trợ khách hàng */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-white">Hỗ trợ khách hàng</h4>
            <ul className="space-y-2 text-gray-400 text-xs">
              <li>
                <Link to="/pc-builder" className="hover:text-white transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-blue-400">construction</span>
                  <span>Công cụ Xây dựng cấu hình PC</span>
                </Link>
              </li>
              <li>
                <Link to="/account?tab=loyalty" className="hover:text-white transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-amber-400">star</span>
                  <span>Chương trình tích điểm MadK Rewards</span>
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-white transition-colors">
                  Hướng dẫn mua hàng trả góp 0%
                </Link>
              </li>
              <li>
                <Link to="/tracking" className="hover:text-white transition-colors">
                  Tra cứu hóa đơn điện tử e-VAT
                </Link>
              </li>
              <li>
                <a href="mailto:support@madkstore.vn" className="hover:text-white transition-colors">
                  Liên hệ hợp tác & Bán hàng doanh nghiệp (B2B)
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Thanh toán & Vận chuyển */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-white">Thanh toán & Vận chuyển</h4>
            <p className="text-gray-400 text-xs leading-relaxed">
              Hỗ trợ đa dạng phương thức thanh toán an toàn, bảo mật cao:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-1 bg-[#1F2937] border border-[#374151] rounded text-[10px] text-gray-200 font-medium">VNPay</span>
              <span className="px-2 py-1 bg-[#1F2937] border border-[#374151] rounded text-[10px] text-gray-200 font-medium">Ví MoMo</span>
              <span className="px-2 py-1 bg-[#1F2937] border border-[#374151] rounded text-[10px] text-gray-200 font-medium">VietQR Napas247</span>
              <span className="px-2 py-1 bg-[#1F2937] border border-[#374151] rounded text-[10px] text-gray-200 font-medium">COD (Giao nhận thu tiền)</span>
            </div>
            <div className="pt-2 text-xs text-gray-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-gray-400">local_shipping</span>
              <span>Đối tác vận chuyển chính thức: <strong>Giao Hàng Nhanh (GHN)</strong></span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Strict Text Regulatory */}
        <div className="mt-8 pt-6 border-t border-[#374151] flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <div>
            <div>© {new Date().getFullYear()} MadK Store Vietnam. Giấy phép ĐKKD số 0102030405 do Sở KH&ĐT TP.HCM cấp.</div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              Đã đăng ký Bộ Công Thương &bull; Chứng nhận Sàn Thương Mại Điện Tử uy tín
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <Link to="/policies/privacy" className="hover:text-white transition-colors">Điều khoản dịch vụ</Link>
            <span>•</span>
            <Link to="/policies/warranty" className="hover:text-white transition-colors">Quy chế hoạt động</Link>
            <span>•</span>
            <span className="text-gray-500">React 18 & Three.js 3D & ASP.NET Core 8</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
