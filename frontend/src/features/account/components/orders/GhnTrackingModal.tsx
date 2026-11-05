import React, { useEffect, useState } from 'react';
import shippingApi, { GhnTrackingDetail } from '../../../../api/shippingApi';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';

interface GhnTrackingModalProps {
  orderNumber: string;
  trackingCode?: string | null;
  onClose: () => void;
}

export const GhnTrackingModal: React.FC<GhnTrackingModalProps> = ({
  orderNumber,
  trackingCode,
  onClose,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<GhnTrackingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchTracking = async () => {
      setLoading(true);
      setError(null);
      const res = await shippingApi.getTrackingDetail(trackingCode || orderNumber);
      if (!isMounted) return;

      if (res.isSuccess && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Chưa có thông tin cập nhật hành trình từ bưu cục.');
      }
      setLoading(false);
    };

    fetchTracking();
    return () => {
      isMounted = false;
    };
  }, [orderNumber, trackingCode]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-hidden space-y-5 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl font-black">
              🚚
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Hành trình giao vận GHN</h2>
              <p className="text-xs text-slate-500">Đơn vị vận chuyển: Giao Hàng Nhanh Express</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <LoadingSpinner size="md" />
            <p className="text-xs text-slate-500 font-medium">Đang kết nối tới máy chủ GHN...</p>
          </div>
        ) : error && !data ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <p className="text-sm font-semibold text-slate-800">{error}</p>
            <p className="text-xs text-slate-400">
              Kiện hàng vừa được khởi tạo và đang chuẩn bị được bưu tá tiếp nhận tại kho.
            </p>
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* Box mã vận đơn & Trạng thái hiện tại */}
            <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-orange-700">Mã vận đơn:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-slate-900 text-sm">{data.trackingCode}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(data.trackingCode)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-orange-200 text-orange-700 hover:bg-orange-100 transition-colors"
                  >
                    {copied ? '✓ Đã chép' : '📋 Chép'}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-orange-200/50">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="font-extrabold text-orange-600 bg-white px-2.5 py-0.5 rounded-full border border-orange-200">
                  {data.statusDescription}
                </span>
              </div>
            </div>

            {/* Shipper & Hotline */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Bưu cục xử lý</span>
                <span className="font-semibold text-slate-800 mt-0.5 block truncate">{data.warehouse || 'Bưu cục GHN'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Hotline hỗ trợ</span>
                <a href="tel:1900636677" className="font-bold text-orange-600 mt-0.5 block hover:underline">
                  1900 636677
                </a>
              </div>
            </div>

            {/* Timeline hành trình */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              <h4 className="text-[11px] uppercase font-extrabold text-slate-400">Lịch sử di chuyển kiện hàng</h4>
              <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {data.logs.map((log, idx) => (
                  <div key={idx} className="relative text-xs">
                    <div
                      className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white ${
                        idx === 0 ? 'bg-orange-500 ring-4 ring-orange-100' : 'bg-slate-300'
                      }`}
                    />
                    <div className="flex justify-between items-baseline gap-2">
                      <span className={`font-bold ${idx === 0 ? 'text-slate-900' : 'text-slate-600'}`}>
                        {log.description}
                      </span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(log.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                        {new Date(log.time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                    {log.location && <span className="text-[11px] text-slate-400 block">{log.location}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default GhnTrackingModal;
