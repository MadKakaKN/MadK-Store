import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import paymentApi from '../../../api/paymentApi';
import { formatVND } from '../../../utils/format';
import type { VnpayCallbackResultDto } from '../../../types/order';

export const VnpayReturnPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [result, setResult] = useState<VnpayCallbackResultDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRetryingPayment, setIsRetryingPayment] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const verify = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      if (!location.search) {
        if (isMounted) {
          setErrorMessage('Không tìm thấy thông tin phản hồi từ cổng thanh toán VNPay.');
          setIsLoading(false);
        }
        return;
      }

      const res = await paymentApi.verifyPaymentReturn(location.search);
      if (!isMounted) return;

      if (res.isSuccess && res.data) {
        setResult(res.data);
      } else {
        setErrorMessage(res.error || 'Xác thực phản hồi từ VNPay thất bại.');
      }
      setIsLoading(false);
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [location.search]);

  // Xử lý thanh toán lại nếu đơn chưa thanh toán hoặc thất bại
  const handleRetryPayment = async () => {
    if (!result?.orderNumber) return;
    setIsRetryingPayment(true);
    try {
      const res = await paymentApi.createPaymentUrl(result.orderNumber);
      if (res.isSuccess && res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        alert(res.error || 'Không thể tạo phiên thanh toán mới.');
      }
    } catch {
      alert('Lỗi kết nối khi khởi tạo lại thanh toán.');
    } finally {
      setIsRetryingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 px-4 max-w-xl mx-auto text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 border-4 border-brand-500/20 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Đang đối soát kết quả VNPay...</h1>
          <p className="mt-2 text-xs text-slate-500">
            Hệ thống đang kiểm tra chữ ký số HMAC-SHA512 và xác thực giao dịch với cổng thanh toán.
          </p>
        </div>
      </div>
    );
  }

  // Trường hợp chữ ký số sai hoặc lỗi đường dẫn
  if (errorMessage && !result) {
    return (
      <div className="py-12 sm:py-20 px-4 max-w-xl mx-auto space-y-6 animate-fade-in">
        <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Lỗi xác thực phản hồi thanh toán</h1>
            <p className="mt-2 text-xs sm:text-sm text-rose-600 leading-relaxed font-medium">
              {errorMessage}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Chữ ký bảo mật (checksum) không hợp lệ hoặc dữ liệu URL đã bị thay đổi bất thường.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/cart"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Quay lại giỏ hàng
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-colors shadow-sm"
            >
              Trang chủ MadK Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = result?.isSuccess === true;

  return (
    <div className="py-10 sm:py-16 px-4 max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Main Result Card */}
      <div
        className={`bg-white rounded-3xl p-6 sm:p-10 border shadow-sm space-y-6 ${
          isSuccess ? 'border-emerald-200/80 ring-1 ring-emerald-500/10' : 'border-rose-200'
        }`}
      >
        {/* Status Icon & Header */}
        <div className="text-center space-y-3">
          <div
            className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-inner ${
              isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}
          >
            {isSuccess ? '✅' : '❌'}
          </div>

          <div>
            <span
              className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full inline-block ${
                isSuccess
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {isSuccess ? 'Thanh toán trực tuyến thành công' : 'Thanh toán không thành công'}
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isSuccess ? 'Đơn hàng đã được thanh toán!' : 'Giao dịch VNPay chưa hoàn tất'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {result?.message}
            </p>
          </div>
        </div>

        {/* Transaction Details Box */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500">Mã đơn hàng:</span>
            <span className="font-mono font-black text-slate-900 text-sm">{result?.orderNumber}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Số tiền thanh toán:</span>
            <span className="font-mono font-bold text-brand-600 text-base">
              {formatVND(result?.amount || 0)}
            </span>
          </div>

          {result?.bankCode && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Ngân hàng / Cổng:</span>
              <span className="font-semibold text-slate-800 uppercase">{result.bankCode}</span>
            </div>
          )}

          {result?.transactionNo && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Mã giao dịch VNPay:</span>
              <span className="font-mono text-slate-700">{result.transactionNo}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Mã phản hồi cổng (ResponseCode):</span>
            <span className="font-mono font-bold text-slate-700">{result?.responseCode}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="text-slate-500">Trạng thái thanh toán hệ thống:</span>
            <span
              className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                result?.status === 'Paid'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {result?.status === 'Paid' ? 'Đã thanh toán (Paid)' : result?.status}
            </span>
          </div>
        </div>

        {/* Reassurance Notice on IPN as Source of Truth */}
        <div className="p-4 rounded-2xl bg-brand-50/50 border border-brand-200/60 text-[11px] text-slate-600 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-brand-900">
            <span>🛡️</span>
            <span>Cơ chế bảo vệ dữ liệu độc lập (IPN Webhook)</span>
          </div>
          <p className="leading-relaxed">
            Hệ thống xác thực trạng thái đơn hàng tự động từ máy chủ VNPay (IPN). Ngay cả khi bạn tắt trình duyệt hoặc mất kết nối mạng giữa chừng, đơn hàng vẫn được chuyển trạng thái chính xác và giữ hàng an toàn.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isSuccess ? (
            <>
              <button
                type="button"
                onClick={() => navigate(`/orders/${encodeURIComponent(result!.orderNumber)}`)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-black text-xs sm:text-sm shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Xem chi tiết đơn hàng</span>
                <span>&rarr;</span>
              </button>
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors text-center"
              >
                Tiếp tục mua sắm
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRetryPayment}
                disabled={isRetryingPayment}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-2"
              >
                {isRetryingPayment ? 'Đang tạo liên kết...' : 'Thử thanh toán lại qua VNPay'}
              </button>
              <Link
                to="/cart"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors text-center"
              >
                Quay về giỏ hàng
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VnpayReturnPage;
