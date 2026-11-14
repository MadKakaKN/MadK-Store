import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SEOHead from '../../../components/common/SEOHead';
import { formatVND } from '../../../utils/format';

interface TrackingTimelineStep {
  title: string;
  time: string;
  description: string;
  completed: boolean;
  current?: boolean;
}

export const OrderAndWarrantyTrackingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'warranty' ? 'warranty' : 'order';
  const initialQuery = searchParams.get('q') || '';

  const [activeTab, setActiveTab] = useState<'order' | 'warranty'>(initialTab);
  const [query, setQuery] = useState(initialQuery);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

  // Simulated Order Result
  const [orderResult, setOrderResult] = useState<any | null>(null);
  // Simulated Warranty Result
  const [warrantyResult, setWarrantyResult] = useState<any | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedSerial(text);
    setTimeout(() => setCopiedSerial(null), 2000);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);

    setTimeout(() => {
      setLoading(false);
      if (activeTab === 'order') {
        setOrderResult({
          orderNumber: query.toUpperCase().startsWith('MADK-') || query.toUpperCase().startsWith('ORD-')
            ? query.toUpperCase()
            : `MADK-2025-89412`,
          orderDate: '24/10/2025 (14:15)',
          status: 'SHIPPING',
          statusText: 'Đang giao hàng (GHN Hỏa tốc)',
          carrier: 'Giao Hàng Nhanh (GHN Express)',
          trackingCode: 'GHN889234VN',
          recipientName: 'Nguyễn Hữu Nam',
          recipientPhone: query.match(/^\d+$/) ? query : '0912.345.678',
          recipientAddress: 'Tòa nhà Bitexco, 2 Hải Triều, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
          items: [
            {
              name: 'ASUS ROG Strix SCAR 16 (2024)',
              specs: 'i9-14900HX • RTX 4090 • 32GB • 1TB • Đen Titanium',
              serialNumber: 'SN-ASUS-99281-VN',
              warrantyPeriod: '24/10/2024 - 24/10/2026',
              quantity: 1,
              price: 89990000,
              thumbnailUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300',
            },
            {
              name: 'Chuột Không Dây Logitech G304 Lightspeed (White)',
              specs: 'Cảm biến HERO 12K DPI • Trắng',
              serialNumber: 'SN-LOGI-88210',
              warrantyPeriod: '24/10/2024 - 24/10/2026',
              quantity: 1,
              price: 890000,
              thumbnailUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=300',
            },
          ],
          totalAmount: 90880000,
          paymentMethod: 'Đã thanh toán (VNPAY-QR)',
          timeline: [
            {
              title: 'Đặt hàng thành công',
              time: '14:15 - 24/10/2025',
              description: 'Khách hàng đặt đơn thành công tại madkstore.vn. Đơn vị xử lý tự động ghi nhận.',
              completed: true,
            },
            {
              title: 'Đã xác nhận đơn hàng',
              time: '14:20 - 24/10/2025',
              description: 'Xác nhận thanh toán qua cổng VNPAY-QR thành công. ID giao dịch: TX-902189.',
              completed: true,
            },
            {
              title: 'Đang xuất kho & Niêm phong',
              time: '14:40 - 24/10/2025',
              description: 'Bàn giao thành công cho bưu cục GHN Quận 1. Đã dán tem niêm phong và kích hoạt bảo hành điện tử e-Warranty.',
              completed: true,
            },
            {
              title: 'Đang giao hàng hỏa tốc',
              time: '15:10 - 24/10/2025',
              description: 'Shipper GHN: Nguyễn Văn B (0909.112.233) đang trên đường giao, dự kiến trước 16:30.',
              completed: true,
              current: true,
            },
            {
              title: 'Đã giao hàng & Đồng kiểm',
              time: 'Dự kiến hôm nay',
              description: 'Khách hàng kiểm tra niêm phong kiện hàng và ký nhận bưu phẩm.',
              completed: false,
            },
          ],
        });
      } else {
        const serialFormatted = query.toUpperCase().startsWith('#')
          ? query.toUpperCase()
          : query.toUpperCase().includes('FA4449')
          ? '#MK-20261102-FA4449'
          : `#MK-20261102-${query.toUpperCase() || 'FA4449'}`;

        setWarrantyResult({
          serialNumber: serialFormatted,
          productName: 'Màn hình ASUS TUF Gaming VG249Q3A 24 inch Fast IPS 180Hz',
          purchaseDate: '15/05/2025',
          warrantyMonths: 36,
          expiryDate: '15/05/2028',
          remainingDays: 552,
          status: 'ACTIVE',
          statusText: 'Còn hạn bảo hành chính hãng',
          customerName: 'Nguyễn Hoàng Khang',
          customerPhone: '0912.345.678',
          distributor: 'MadK Store & ASUS Authorized Service Partner',
          serviceCenters: [
            {
              city: 'TP. Hồ Chí Minh',
              address: 'Số 285 Cách Mạng Tháng 8, Phường 12, Quận 10',
              hotline: '1900 8888 (Nhánh 1)',
            },
            {
              city: 'Hà Nội',
              address: 'Số 110 Thái Hà, Phường Trung Liệt, Đống Đa',
              hotline: '1900 8888 (Nhánh 2)',
            },
            {
              city: 'Đà Nẵng',
              address: 'Số 72 Hàm Nghi, Phường Thạc Gián, Thanh Khê',
              hotline: '1900 8888 (Nhánh 3)',
            },
          ],
        });
      }
    }, 350);
  };

  return (
    <div className="bg-[#F9FAFB] text-gray-900 font-sans text-sm antialiased min-h-screen pb-12">
      <SEOHead
        title="Tra Cứu Đơn Hàng & Bảo Hành Điện Tử | MadK Store"
        description="Tra cứu tiến độ hành trình giao hàng GHN Express và kiểm tra thời hạn bảo hành điện tử chính hãng theo số điện thoại, mã đơn hàng hoặc Serial/IMEI tại MadK Store."
        canonicalUrl="https://madk.store/tracking"
        keywords="tra cứu đơn hàng, tra cứu bảo hành, ghn tracking, check serial madk, bảo hành điện tử"
      />

      {/* Breadcrumb - Flat Retail Style */}
      <div className="bg-white border-b border-[#E5E7EB] py-2 px-4 mb-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-gray-500">
          <a className="hover:text-[#1D4ED8] flex items-center gap-1 transition-colors" href="/">
            <span className="material-symbols-outlined text-sm">home</span>
            Trang chủ
          </a>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500">Dịch vụ khách hàng</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium">Tra cứu đơn hàng &amp; Bảo hành</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 w-full">
        {/* Page Title */}
        <div className="text-center max-w-xl mx-auto mb-6">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">
            Tra Cứu Đơn Hàng &amp; Bảo Hành
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Nhập thông tin mã đơn hàng hoặc số điện thoại để kiểm tra hành trình vận chuyển và kích hoạt bảo hành điện tử.
          </p>
        </div>

        {/* Form Card (Stitch Screen 11 Retail Spec) */}
        <div className="max-w-3xl mx-auto bg-white border border-[#E5E7EB] p-5 sm:p-6 mb-6 rounded">
          {/* Quick lookup tabs */}
          <div className="flex border-b border-[#E5E7EB] mb-5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('order');
                setHasSearched(false);
              }}
              className={`flex items-center gap-1.5 py-2 px-4 text-xs font-semibold -mb-px transition-colors ${
                activeTab === 'order'
                  ? 'text-[#1D4ED8] border-b-2 border-[#1D4ED8]'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className="material-symbols-outlined text-base">local_shipping</span>
              <span>Đơn mua online</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('warranty');
                setHasSearched(false);
              }}
              className={`flex items-center gap-1.5 py-2 px-4 text-xs font-semibold -mb-px transition-colors ${
                activeTab === 'warranty'
                  ? 'text-[#1D4ED8] border-b-2 border-[#1D4ED8]'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className="material-symbols-outlined text-base">qr_code_scanner</span>
              <span>Bảo hành thiết bị / IMEI</span>
            </button>
          </div>

          {/* Search Input Box */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {activeTab === 'order' ? 'Mã đơn hàng' : 'Số Serial / Mã IMEI thiết bị'}{' '}
                  <span className="text-[#D70018]">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-base pointer-events-none">
                    {activeTab === 'order' ? 'tag' : 'qr_code'}
                  </span>
                  <input
                    type="text"
                    required
                    placeholder={
                      activeTab === 'order'
                        ? 'Ví dụ: MADK-2025-89412'
                        : 'Ví dụ: #MK-20261102-FA4449'
                    }
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 bg-white border border-[#E5E7EB] rounded text-xs text-gray-900 placeholder-gray-400 focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {activeTab === 'order' ? 'Số điện thoại đặt hàng' : 'Số điện thoại đăng ký bảo hành'}{' '}
                  <span className="text-[#D70018]">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-base pointer-events-none">
                    call
                  </span>
                  <input
                    type="tel"
                    placeholder="Ví dụ: 0912345678"
                    defaultValue="0912345678"
                    className="w-full h-9 pl-9 pr-3 bg-white border border-[#E5E7EB] rounded text-xs text-gray-900 placeholder-gray-400 focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-gray-400">info</span>
                {activeTab === 'order'
                  ? 'Quên mã đơn? Kiểm tra SMS/Email xác nhận hoặc liên hệ tổng đài 1800 6868.'
                  : 'Serial dán phía sau thân máy hoặc vỏ hộp sản phẩm.'}
              </span>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 h-9 bg-[#1D4ED8] hover:bg-[#1e40af] disabled:opacity-50 text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
              >
                <span className="material-symbols-outlined text-base">search</span>
                <span>{loading ? 'Đang tra cứu...' : activeTab === 'order' ? 'Tra cứu đơn hàng' : 'Tra cứu bảo hành'}</span>
              </button>
            </div>

            {/* Example query chips */}
            <div className="flex items-center gap-2 text-xs text-gray-400 pt-1 border-t border-gray-100 flex-wrap">
              <span>Gợi ý tra cứu nhanh:</span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('order');
                  setQuery('MADK-2025-89412');
                }}
                className="text-[#1D4ED8] hover:underline font-medium"
              >
                MADK-2025-89412
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('warranty');
                  setQuery('#MK-20261102-FA4449');
                }}
                className="text-[#1D4ED8] hover:underline font-medium"
              >
                #MK-20261102-FA4449
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('warranty');
                  setQuery('SN-ASUS-99281-VN');
                }}
                className="text-[#1D4ED8] hover:underline font-medium"
              >
                SN-ASUS-99281-VN
              </button>
            </div>
          </form>
        </div>

        {/* Results Container (max-w-5xl, flat retail style) */}
        {hasSearched && (
          <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in duration-200">
            {/* WARRANTY RESULT SPEC */}
            {activeTab === 'warranty' && warrantyResult && (
              <div className="space-y-4">
                {/* 1. Header Card */}
                <div className="bg-white border border-[#E5E7EB] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded bg-blue-50 border border-blue-200 text-[#1D4ED8] flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-2xl">verified_user</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-sm sm:text-base font-semibold text-gray-900 tracking-tight">
                          {warrantyResult.productName}
                        </h2>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-700 border border-green-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                          {warrantyResult.statusText}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <span>Số Serial:</span>
                          <strong className="font-mono text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-[11px]">
                            {warrantyResult.serialNumber}
                          </strong>
                          <button
                            type="button"
                            onClick={() => handleCopy(warrantyResult.serialNumber)}
                            title="Sao chép Serial"
                            className="text-gray-400 hover:text-gray-700 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {copiedSerial === warrantyResult.serialNumber ? 'check' : 'content_copy'}
                            </span>
                          </button>
                        </span>
                        <span>•</span>
                        <span>
                          Thời hạn còn lại: <strong className="text-green-700 font-semibold">{warrantyResult.remainingDays} ngày</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 h-8 border border-[#E5E7EB] bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">print</span>
                      <span>In phiếu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => alert('Yêu cầu hỗ trợ kỹ thuật bảo hành đã gửi đến chuyên viên MadK Care!')}
                      className="px-3 h-8 border border-[#1D4ED8] text-[#1D4ED8] hover:bg-blue-50 text-xs font-medium rounded flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">home_repair_service</span>
                      <span>Yêu cầu hỗ trợ</span>
                    </button>
                  </div>
                </div>

                {/* 2. Specs Details Grid */}
                <div className="bg-white border border-[#E5E7EB] p-4 sm:p-5 rounded">
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-[#1D4ED8]">fact_check</span>
                    <span>Thông Tin Kích Hoạt &amp; Thời Hạn Bảo Hành</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded bg-gray-50 border border-[#E5E7EB] text-xs">
                    <div>
                      <span className="text-gray-500 block mb-1">Ngày mua hàng:</span>
                      <span className="font-semibold text-gray-900">{warrantyResult.purchaseDate}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">Thời hạn bảo hành:</span>
                      <span className="font-semibold text-gray-900">{warrantyResult.warrantyMonths} Tháng</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">Ngày hết hạn:</span>
                      <span className="font-semibold text-[#D70018]">{warrantyResult.expiryDate}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">Hình thức bảo hành:</span>
                      <span className="font-semibold text-gray-900">1 Đổi 1 trong 30 ngày</span>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                    <div>
                      <span className="text-gray-400 block mb-0.5">Khách hàng sở hữu:</span>
                      <strong className="text-gray-800">{warrantyResult.customerName} ({warrantyResult.customerPhone})</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Đơn vị ủy quyền:</span>
                      <span className="text-gray-800">{warrantyResult.distributor}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Hình thức tiếp nhận:</span>
                      <span className="text-green-700 font-medium">Bảo hành điện tử e-Warranty (Chính hãng 100%)</span>
                    </div>
                  </div>
                </div>

                {/* 3. Authorized Service Centers */}
                <div className="bg-white border border-[#E5E7EB] p-4 sm:p-5 rounded">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E7EB]">
                    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-[#1D4ED8]">store</span>
                      <span>Hệ thống trung tâm tiếp nhận bảo hành MadK Care</span>
                    </h3>
                    <span className="text-xs text-gray-500">Mở cửa: 08:30 - 21:30 hàng ngày</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {warrantyResult.serviceCenters.map((sc: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 rounded border border-[#E5E7EB] bg-white hover:border-[#1D4ED8] transition-colors flex flex-col justify-between"
                      >
                        <div>
                          <div className="font-semibold text-xs text-[#1D4ED8] flex items-center gap-1.5 mb-1.5">
                            <span className="material-symbols-outlined text-base">location_on</span>
                            <span>{sc.city}</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{sc.address}</p>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-3 pt-2 border-t border-gray-100 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-gray-400">call</span>
                          <span>Hotline: <strong className="text-gray-800">{sc.hotline}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Book Pickup CTA Banner - Retail Dark Strip */}
                <div className="p-4 sm:p-5 rounded bg-[#111827] text-white border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-white/10 border border-white/20 text-white flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-2xl">local_shipping</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm text-white">Cần gửi bảo hành tận nhà?</h4>
                      <p className="text-xs text-gray-300 mt-0.5">
                        MadK Store hỗ trợ bưu tá GHN đến tận nhà nhận máy và trả máy miễn phí toàn quốc.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => alert('Yêu cầu nhận máy bảo hành đã được ghi nhận! Bưu tá GHN sẽ liên hệ bạn trong 2 giờ.')}
                    className="w-full sm:w-auto px-5 h-9 bg-white text-[#111827] hover:bg-gray-100 font-semibold text-xs rounded transition-colors flex items-center justify-center gap-1.5 flex-shrink-0 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm text-[#1D4ED8]">send</span>
                    <span>Yêu cầu lấy hàng tận nơi &rarr;</span>
                  </button>
                </div>
              </div>
            )}

            {/* ORDER RESULT SPEC */}
            {activeTab === 'order' && orderResult && (
              <div className="space-y-4">
                {/* 1. Order Info Header Bar */}
                <div className="bg-white border border-[#E5E7EB] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-9 h-9 rounded bg-blue-50 border border-blue-200 text-[#1D4ED8] flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-xl">inventory_2</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">Mã đơn #{orderResult.orderNumber}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-[#1D4ED8] border border-blue-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]"></span>
                          {orderResult.statusText}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                          {orderResult.paymentMethod}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Ngày đặt: {orderResult.orderDate} &bull; Đơn vị: {orderResult.carrier} (Mã vận đơn: <strong className="font-mono text-gray-800">{orderResult.trackingCode}</strong>)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 h-8 border border-[#E5E7EB] bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">print</span>
                      <span>In đơn</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => alert('Yêu cầu xuất hóa đơn điện tử VAT đã được gửi tới email khách hàng!')}
                      className="px-3 h-8 border border-[#E5E7EB] bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">receipt_long</span>
                      <span>Xuất hóa đơn VAT</span>
                    </button>
                  </div>
                </div>

                {/* 2. Timeline Progress Bar */}
                <div className="bg-white border border-[#E5E7EB] p-5 rounded">
                  <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-[#1D4ED8]">alt_route</span>
                    <span>Tiến trình xử lý &amp; Vận chuyển</span>
                  </h2>

                  {/* Horizontal Stage Progress */}
                  <div className="relative mb-8 pb-4 border-b border-[#E5E7EB] hidden sm:block">
                    <div className="grid grid-cols-5 text-center relative z-10">
                      {orderResult.timeline.map((step: TrackingTimelineStep, idx: number) => (
                        <div key={idx} className="flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 ${
                              step.current
                                ? 'bg-white border-2 border-[#1D4ED8] text-[#1D4ED8]'
                                : step.completed
                                ? 'bg-[#1D4ED8] text-white'
                                : 'bg-white border border-[#E5E7EB] text-gray-400'
                            }`}
                          >
                            {step.completed ? (
                              <span className="material-symbols-outlined text-sm">check</span>
                            ) : (
                              idx + 1
                            )}
                          </div>
                          <span className={`text-xs ${step.current ? 'font-semibold text-[#1D4ED8]' : step.completed ? 'font-medium text-gray-900' : 'text-gray-400'}`}>
                            {step.title}
                          </span>
                          <span className="text-[11px] text-gray-400 mt-0.5">{step.time.split(' - ')[0]}</span>
                        </div>
                      ))}
                    </div>
                    {/* Connecting line */}
                    <div className="absolute top-3.5 left-8 right-8 h-0.5 bg-gray-200 z-0">
                      <div className="h-full bg-[#1D4ED8]" style={{ width: '70%' }}></div>
                    </div>
                  </div>

                  {/* Vertical Timestamps */}
                  <div>
                    <h3 className="text-xs font-medium text-gray-700 mb-3">Nhật ký chi tiết:</h3>
                    <div className="relative pl-6 space-y-4 border-l border-gray-200 ml-3">
                      {orderResult.timeline.map((step: TrackingTimelineStep, idx: number) => (
                        <div key={idx} className="relative">
                          <div
                            className={`absolute -left-[31px] top-0.5 w-3 h-3 rounded-full border-2 border-white ${
                              step.current ? 'bg-[#1D4ED8]' : step.completed ? 'bg-[#1D4ED8]' : 'bg-gray-300'
                            }`}
                          ></div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className={`text-xs ${step.current ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                              {step.time} &bull; {step.title}
                            </span>
                            {step.current && (
                              <span className="text-[11px] font-semibold text-[#1D4ED8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                Đang diễn ra
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Items & Serial / IMEI Table */}
                <div className="bg-white border border-[#E5E7EB] overflow-hidden rounded">
                  <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-[#1D4ED8]">devices</span>
                      <span>Danh sách thiết bị &amp; Quản lý Serial / IMEI</span>
                    </h2>
                    <span className="text-xs text-gray-500">{orderResult.items.length} sản phẩm</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-[#E5E7EB] text-gray-600 font-medium">
                          <th className="py-2.5 px-4 w-12 text-center">STT</th>
                          <th className="py-2.5 px-4">Sản phẩm</th>
                          <th className="py-2.5 px-4">Serial / IMEI Bảo hành</th>
                          <th className="py-2.5 px-4 text-center">SL</th>
                          <th className="py-2.5 px-4 text-right">Đơn giá</th>
                          <th className="py-2.5 px-4 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {orderResult.items.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3 px-4 text-center text-gray-500">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded border border-[#E5E7EB] bg-white p-1 flex-shrink-0 flex items-center justify-center">
                                  <img alt={item.name} className="max-h-full max-w-full object-contain" src={item.thumbnailUrl} />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 hover:text-[#1D4ED8] cursor-pointer">{item.name}</p>
                                  <p className="text-[11px] text-gray-500">{item.specs}</p>
                                  <div className="mt-1 flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 text-[11px] text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
                                      <span className="material-symbols-outlined text-xs">verified</span>
                                      e-Warranty kích hoạt
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-0.5 font-mono text-[11px]">
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500 font-sans">SN:</span>
                                  <strong className="text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                    {item.serialNumber}
                                  </strong>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(item.serialNumber)}
                                    title="Sao chép"
                                    className="text-gray-400 hover:text-gray-700 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-xs">
                                      {copiedSerial === item.serialNumber ? 'check' : 'content_copy'}
                                    </span>
                                  </button>
                                </div>
                                <p className="text-[10px] text-gray-500 font-sans">Thời hạn: {item.warrantyPeriod}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center font-medium">{item.quantity}</td>
                            <td className="py-3 px-4 text-right text-gray-700">{formatVND(item.price)}</td>
                            <td className="py-3 px-4 text-right font-semibold text-[#D70018]">{formatVND(item.price * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 border-t border-[#E5E7EB]">
                          <td className="py-2.5 px-4 text-right text-gray-600 font-medium" colSpan={4}>Tổng tiền sản phẩm:</td>
                          <td className="py-2.5 px-4 text-right text-gray-900 font-semibold" colSpan={2}>{formatVND(orderResult.totalAmount)}</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="py-2.5 px-4 text-right text-gray-600 font-medium" colSpan={4}>Phí vận chuyển hỏa tốc:</td>
                          <td className="py-2.5 px-4 text-right text-green-600 font-medium" colSpan={2}>Miễn phí (0₫)</td>
                        </tr>
                        <tr className="bg-gray-50 border-t border-[#E5E7EB]">
                          <td className="py-3 px-4 text-right text-gray-900 font-bold" colSpan={4}>Tổng thanh toán:</td>
                          <td className="py-3 px-4 text-right font-bold text-base text-[#D70018]" colSpan={2}>{formatVND(orderResult.totalAmount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* 4. Recipient Details & Hotline */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2 bg-white border border-[#E5E7EB] p-5 rounded">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E7EB]">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#1D4ED8] text-xl">location_on</span>
                        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Thông Tin Người Nhận &amp; Giao Hàng</h3>
                      </div>
                      <span className="text-[11px] font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                        Đồng kiểm hàng khi nhận
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-gray-500">Người nhận hàng:</span>
                        <p className="font-semibold text-gray-800">{orderResult.recipientName} - {orderResult.recipientPhone}</p>
                        <p className="text-[11px] text-gray-500">Địa chỉ: {orderResult.recipientAddress}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-500">Hình thức nhận hàng:</span>
                        <p className="font-semibold text-gray-800">Giao hàng hỏa tốc GHN Express</p>
                        <p className="text-[11px] text-gray-500">Đóng gói chống sốc 3 lớp, dán tem vỡ niêm phong MadK Care.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#E5E7EB] p-5 flex flex-col justify-between rounded">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded bg-red-50 text-[#D70018] flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-lg">support_agent</span>
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Hỗ Trợ Nhanh</h3>
                          <p className="text-[11px] text-gray-500">Kỹ thuật &amp; Tiến độ đơn</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 border border-[#E5E7EB] rounded p-3 mb-3 text-center">
                        <span className="text-[11px] text-gray-500 block mb-0.5">Tổng đài tiếp nhận miễn phí</span>
                        <a className="text-base font-bold text-[#D70018] tracking-tight block hover:underline" href="tel:18006868">
                          1800 6868 (Miễn phí)
                        </a>
                        <span className="text-[10px] text-gray-400 block mt-0.5">08:30 - 21:30 hàng ngày</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => alert('Đang kết nối trung tâm trợ giúp MadK Care...')}
                      className="w-full h-8 border border-[#1D4ED8] text-[#1D4ED8] hover:bg-blue-50 text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">chat</span>
                      <span>Chat với CSKH trực tuyến</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderAndWarrantyTrackingPage;
