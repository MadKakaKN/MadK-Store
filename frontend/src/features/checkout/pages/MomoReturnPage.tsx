import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import paymentApi from '../../../api/paymentApi';
import { formatVND } from '../../../utils/format';
import type { MomoCallbackResultDto } from '../../../types/order';

export const MomoReturnPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [result, setResult] = useState<MomoCallbackResultDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRetryingPayment, setIsRetryingPayment] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const verify = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      if (!location.search) {
        if (isMounted) {
          setErrorMessage('Không tìm thấy thông tin phản hồi từ cổng thanh toán Ví MoMo.');
          setIsLoading(false);
        }
        return;
      }

      const res = await paymentApi.verifyMomoPaymentReturn(location.search);
      if (!isMounted) return;

      if (res.isSuccess && res.data) {
        setResult(res.data);
      } else {
        setErrorMessage(res.error || 'Xác thực phản hồi từ Ví MoMo thất bại.');
      }
      setIsLoading(false);
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [location.search]);

  // Xử lý thanh toán lại bằng MoMo
  const handleRetryPayment = async () => {
    if (!result?.orderNumber) return;
    setIsRetryingPayment(true);
    try {
      const res = await paymentApi.createMomoPayment(result.orderNumber);
      if (res.isSuccess && res.data?.payUrl) {
        window.location.href = res.data.payUrl;
      } else {
        alert(res.error || 'Không thể tạo phiên thanh toán mới qua MoMo.');
      }
    } catch {
      alert('Lỗi kết nối khi khởi tạo lại thanh toán MoMo.');
    } finally {
      setIsRetryingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 px-4 max-w-xl mx-auto text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 border-4 border-pink-500/20 border-t-pink-600 rounded-full animate-spin mx-auto"></div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Đang đối soát kết quả MoMo...</h1>
          <p className="mt-2 text-xs text-slate-500">
            Hệ thống đang kiểm tra chữ ký số HMAC-SHA256 và xác thực giao dịch với cổng Ví MoMo.
          </p>
        </div>
      </div>
    );
  }

  // Lỗi chữ ký số hoặc sai URL
  if (errorMessage && !result) {
    return (
      <div className="py-12 sm:py-20 px-4 max-w-xl mx-auto space-y-6 animate-fade-in">
        <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Lỗi xác thực thanh toán</h1>
            <p className="mt-2 text-xs sm:text-sm text-rose-600 leading-relaxed font-medium">
              {errorMessage}
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/account"
              className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all"
            >
              Xem đơn hàng của tôi
            </Link>
            <Link
              to="/"
              className="px-6 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = result?.isSuccess === true;

  return (
    <div className="py-12 sm:py-20 px-4 max-w-xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center space-y-6">
        {/* Biểu tượng trạng thái */}
        <div
          className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-inner ${
            isSuccess ? 'bg-pink-50 text-pink-600' : 'bg-rose-50 text-rose-600'
          }`}
        >
          {isSuccess ? '🎉' : '❌'}
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-pink-100 text-pink-700 mb-2">
            📱 Cổng thanh toán Ví MoMo
          </span>
          <h1 className="text-2xl font-black text-slate-900">
            {isSuccess ? 'Thanh toán MoMo thành công!' : 'Thanh toán không thành công'}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
            {isSuccess
              ? 'Đơn hàng của bạn đã được xác nhận thanh toán trực tuyến qua Ví MoMo. Hệ thống đang tiến hành đóng gói và giao hàng nhanh nhất.'
              : result?.message || 'Giao dịch qua Ví MoMo bị gián đoạn hoặc khách hàng hủy thanh toán.'}
          </p>
        </div>

        {/* Thông tin đối soát chi tiết */}
        {result && (
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Mã đơn hàng:</span>
              <span className="font-bold text-slate-900 font-mono">{result.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Số tiền:</span>
              <span className="font-bold text-pink-600 text-base">{formatVND(result.amount)}</span>
            </div>
            {result.transId && (
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Mã giao dịch MoMo:</span>
                <span className="font-mono text-slate-700">{result.transId}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Phương thức:</span>
              <span className="font-semibold text-slate-800">Ví điện tử MoMo (AIO)</span>
            </div>
          </div>
        )}

        {/* Hành động điều hướng */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          {isSuccess ? (
            <>
              <button
                type="button"
                onClick={() => navigate(`/checkout/success?orderNumber=${encodeURIComponent(result!.orderNumber)}`)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
              >
                Xem chi tiết đơn hàng
              </button>
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all text-center"
              >
                Tiếp tục mua sắm
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={isRetryingPayment}
                onClick={handleRetryPayment}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isRetryingPayment ? 'Đang tạo phiên mới...' : 'Thanh toán lại bằng MoMo'}
              </button>
              <Link
                to="/account"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all text-center"
              >
                Xem đơn hàng của tôi
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MomoReturnPage;
