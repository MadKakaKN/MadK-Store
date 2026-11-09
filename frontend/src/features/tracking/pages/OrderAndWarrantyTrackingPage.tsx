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

  // Simulated Order Result
  const [orderResult, setOrderResult] = useState<any | null>(null);
  // Simulated Warranty Result
  const [warrantyResult, setWarrantyResult] = useState<any | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);

    setTimeout(() => {
      setLoading(false);
      if (activeTab === 'order') {
        setOrderResult({
          orderNumber: query.toUpperCase().startsWith('ORD-') ? query.toUpperCase() : `ORD-${Date.now().toString().slice(-6)}`,
          orderDate: '09/11/2026 14:35',
          status: 'SHIPPING',
          statusText: 'Đang vận chuyển hỏa tốc GHN',
          carrier: 'Giao Hàng Nhanh (GHN Express)',
          trackingCode: 'GHN-MK-88997766VN',
          recipientName: 'Nguyễn Hoàng Khang',
          recipientPhone: query.match(/^\d+$/) ? query : '0987 654 321',
          recipientAddress: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM',
          items: [
            {
              name: 'Card màn hình ASUS Dual GeForce RTX 4070 SUPER EVO OC 12GB',
              quantity: 1,
              price: 16990000,
              thumbnailUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400',
            },
            {
              name: 'Nguồn máy tính Corsair RM750e 750W 80 Plus Gold Modular',
              quantity: 1,
              price: 2690000,
              thumbnailUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400',
            },
          ],
          totalAmount: 19680000,
          paymentMethod: 'VNPAY-QR (Đã thanh toán)',
          timeline: [
            {
              title: 'Đặt hàng thành công',
              time: '09/11/2026 - 14:35',
              description: 'Đơn hàng được ghi nhận trên hệ thống MadK Store',
              completed: true,
            },
            {
              title: 'Thanh toán thành công',
              time: '09/11/2026 - 14:37',
              description: 'Cổng thanh toán VNPAY xác nhận giao dịch an toàn',
              completed: true,
            },
            {
              title: 'Đã xuất kho MadK Hub',
              time: '09/11/2026 - 16:15',
              description: 'Kiểm định tem niêm phong và đóng gói chống sốc 3 lớp',
              completed: true,
            },
            {
              title: 'Bưu tá GHN đang phát hàng',
              time: '09/11/2026 - 18:20',
              description: 'Tài xế GHN Express đang trên đường giao tới địa chỉ nhận',
              completed: true,
              current: true,
            },
            {
              title: 'Giao hàng thành công',
              time: 'Dự kiến hôm nay (trước 21:00)',
              description: 'Khách hàng đồng kiểm tra bưu phẩm trước khi nhận',
              completed: false,
            },
          ],
        });
      } else {
        setWarrantyResult({
          serialNumber: query.toUpperCase(),
          productName: 'Màn hình ASUS TUF Gaming VG249Q3A 24 inch Fast IPS 180Hz',
          purchaseDate: '15/05/2025',
          warrantyMonths: 36,
          expiryDate: '15/05/2028',
          remainingDays: 552,
          status: 'ACTIVE',
          statusText: 'Còn hạn bảo hành chính hãng',
          customerName: 'Nguyễn Hoàng Khang',
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
    }, 400);
  };

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      <SEOHead
        title="Tra Cứu Đơn Hàng & Bảo Hành Điện Tử - MadK Store"
        description="Tra cứu tiến độ hành trình giao hàng GHN Express và kiểm tra thời hạn bảo hành điện tử chính hãng theo số điện thoại, mã đơn hàng hoặc Serial/IMEI tại MadK Store."
        canonicalUrl="https://madk.store/tracking"
        keywords="tra cứu đơn hàng, tra cứu bảo hành, ghn tracking, check serial madk, bảo hành điện tử"
      />

      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
          <span>🔍</span>
          <span>CỔNG THÔNG TIN KHÁCH HÀNG 24/7</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Tra cứu Đơn hàng & Bảo hành Điện tử
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Nhập số điện thoại, mã đơn hàng hoặc số Serial/IMEI để kiểm tra lộ trình giao hàng GHN và hạn bảo hành sản phẩm tức thì.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 rounded-2.5xl bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('order');
              setHasSearched(false);
            }}
            className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'order'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🚚</span>
            <span>Tra cứu đơn hàng (GHN)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('warranty');
              setHasSearched(false);
            }}
            className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'warranty'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🛡️</span>
            <span>Tra cứu bảo hành (Serial)</span>
          </button>
        </div>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
        <div className="relative flex items-center shadow-lg rounded-2.5xl bg-white border border-slate-200/80 p-2 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
          <svg
            className="w-5 h-5 text-slate-400 ml-3 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            required
            placeholder={
              activeTab === 'order'
                ? 'Nhập mã đơn (VD: ORD-123456) hoặc Số điện thoại đặt hàng...'
                : 'Nhập số Serial / IMEI thiết bị (VD: SN-ASUS-9988, IMEI-7788)...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-2 py-3 bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all hover:scale-102 flex items-center gap-2 flex-shrink-0"
          >
            <span>{loading ? 'Đang kiểm tra...' : 'Tra cứu ngay'}</span>
            <span>&rarr;</span>
          </button>
        </div>

        {/* Example query chips */}
        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-400">
          <span>Gợi ý thử nghiệm:</span>
          <button
            type="button"
            onClick={() => {
              setQuery('0987654321');
            }}
            className="underline hover:text-blue-600 font-medium"
          >
            0987654321
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => {
              setQuery('ORD-889922');
            }}
            className="underline hover:text-blue-600 font-medium"
          >
            ORD-889922
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => {
              setQuery('SN-ASUS-VG249');
            }}
            className="underline hover:text-blue-600 font-medium"
          >
            SN-ASUS-VG249
          </button>
        </div>
      </form>

      {/* Results Section */}
      {hasSearched && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          {activeTab === 'order' && orderResult && (
            <div className="bg-white rounded-3.5xl p-6 sm:p-10 border border-slate-200/90 shadow-card space-y-8">
              {/* Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      Đơn hàng #{orderResult.orderNumber}
                    </h2>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      {orderResult.statusText}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Đặt lúc: {orderResult.orderDate} &bull; Mã vận đơn GHN: <strong className="font-mono text-slate-800">{orderResult.trackingCode}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Tổng thanh toán</span>
                  <span className="text-xl sm:text-2xl font-black text-blue-700">
                    {formatVND(orderResult.totalAmount)}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold block">
                    ✓ {orderResult.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Delivery Progress Timeline */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                  <span>🚚</span>
                  <span>Hành trình vận chuyển thời gian thực</span>
                </h3>

                <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {orderResult.timeline.map((step: TrackingTimelineStep, idx: number) => (
                    <div key={idx} className="relative">
                      <div
                        className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                          step.current
                            ? 'bg-blue-600 border-white text-white ring-4 ring-blue-100 animate-pulse'
                            : step.completed
                            ? 'bg-emerald-500 border-white text-white'
                            : 'bg-white border-slate-300 text-slate-400'
                        }`}
                      >
                        {step.completed ? '✓' : idx + 1}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={`text-sm font-bold ${step.current ? 'text-blue-700' : 'text-slate-900'}`}>
                            {step.title}
                          </h4>
                          <span className="text-xs text-slate-400">{step.time}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items in order */}
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Sản phẩm trong kiện hàng</h3>
                <div className="divide-y divide-slate-100">
                  {orderResult.items.map((item: any, i: number) => (
                    <div key={i} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img src={item.thumbnailUrl} alt="" className="w-12 h-12 rounded-xl object-cover bg-slate-100" />
                        <div>
                          <h5 className="font-bold text-xs sm:text-sm text-slate-900">{item.name}</h5>
                          <span className="text-xs text-slate-500">Số lượng: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right text-xs sm:text-sm font-bold text-slate-900">
                        {formatVND(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recipient Details */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
                <div className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                  <span>📍</span>
                  <span>Thông tin người nhận</span>
                </div>
                <p>Họ tên: <strong className="text-slate-800">{orderResult.recipientName}</strong> &bull; SĐT: <strong className="text-slate-800">{orderResult.recipientPhone}</strong></p>
                <p>Địa chỉ nhận: {orderResult.recipientAddress}</p>
              </div>
            </div>
          )}

          {activeTab === 'warranty' && warrantyResult && (
            <div className="bg-white rounded-3.5xl p-6 sm:p-10 border border-slate-200/90 shadow-card space-y-8">
              {/* Warranty Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold">
                      🛡️
                    </span>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900">
                        {warrantyResult.productName}
                      </h2>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Số Serial: <strong className="text-blue-700">{warrantyResult.serialNumber}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{warrantyResult.statusText}</span>
                  </span>
                  <div className="text-xs text-slate-500 mt-1.5 font-medium">
                    Còn lại: <strong className="text-emerald-700">{warrantyResult.remainingDays} ngày</strong>
                  </div>
                </div>
              </div>

              {/* Warranty details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2.5xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Ngày mua hàng:</span>
                  <span className="font-bold text-slate-900">{warrantyResult.purchaseDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Thời hạn bảo hành:</span>
                  <span className="font-bold text-slate-900">{warrantyResult.warrantyMonths} Tháng</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Ngày hết hạn:</span>
                  <span className="font-bold text-rose-600">{warrantyResult.expiryDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Hình thức bảo hành:</span>
                  <span className="font-bold text-slate-900">1 Đổi 1 trong 30 ngày</span>
                </div>
              </div>

              {/* Authorized Service Centers */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span>🏢</span>
                  <span>Hệ thống trung tâm tiếp nhận bảo hành MadK Care</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {warrantyResult.serviceCenters.map((sc: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5 text-xs">
                      <div className="font-bold text-blue-700">{sc.city}</div>
                      <p className="text-slate-600 leading-relaxed">{sc.address}</p>
                      <div className="text-[11px] text-slate-400 pt-1 font-medium">Hotline: {sc.hotline}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Book Pickup CTA */}
              <div className="p-5 rounded-2.5xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm">Cần gửi bảo hành tận nhà?</h4>
                  <p className="text-xs text-blue-200 mt-0.5">
                    MadK Store hỗ trợ bưu tá GHN đến tận nhà nhận máy và trả máy miễn phí toàn quốc.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Yêu cầu nhận máy bảo hành đã gửi! Bưu tá GHN sẽ liên hệ bạn trong 2 giờ.')}
                  className="px-5 py-2.5 rounded-2xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs shadow-md transition-all flex-shrink-0"
                >
                  Yêu cầu lấy hàng tận nơi &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderAndWarrantyTrackingPage;
