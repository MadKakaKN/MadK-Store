import React, { useState } from 'react';
import { formatVND } from '../../../utils/format';

interface InstallmentCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productPrice: number;
  productImage?: string;
}

export const InstallmentCalculatorModal: React.FC<InstallmentCalculatorModalProps> = ({
  isOpen,
  onClose,
  productName,
  productPrice,
  productImage,
}) => {
  const [method, setMethod] = useState<'credit_card' | 'finance'>('credit_card');
  const [prepayPercent, setPrepayPercent] = useState<number>(30); // 30% default
  const [termMonths, setTermMonths] = useState<number>(6); // 6 months
  const [selectedBank, setSelectedBank] = useState<string>('Vietcombank');
  const [selectedFinance, setSelectedFinance] = useState<string>('Home Credit');
  const [registered, setRegistered] = useState(false);

  if (!isOpen) return null;

  // Credit card: 0% interest, small conversion fee (e.g. 1.5% - 2.5%)
  // Finance company: interest ~1.2% - 1.8%/month depending on term
  const prepayAmount = Math.round((productPrice * prepayPercent) / 100);
  const loanAmount = productPrice - prepayAmount;

  let monthlyPayment = 0;
  let totalPaid = 0;
  let difference = 0;

  if (method === 'credit_card') {
    // 0% interest with small bank transaction conversion fee ~ 2%
    const conversionFee = Math.round(loanAmount * 0.02);
    totalPaid = prepayAmount + loanAmount + conversionFee;
    monthlyPayment = Math.round((loanAmount + conversionFee) / termMonths);
    difference = conversionFee;
  } else {
    // Finance company with interest ~ 1.4% / month
    const interestPerMonth = loanAmount * 0.014;
    monthlyPayment = Math.round(loanAmount / termMonths + interestPerMonth);
    totalPaid = prepayAmount + monthlyPayment * termMonths;
    difference = totalPaid - productPrice;
  }

  const banks = [
    'Vietcombank',
    'Techcombank',
    'MB Bank',
    'VPBank',
    'TPBank',
    'ACB',
    'Sacombank',
    'VIB',
    'Shinhan Bank',
    'HSBC',
  ];

  const finances = ['Home Credit', 'FE Credit', 'HD SAISON', 'Shinhan Finance'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3.5xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
              💳
            </span>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900">
                Bảng tính Trả Góp 0% Lãi Suất
              </h3>
              <p className="text-xs text-slate-500">Dự toán kế hoạch tài chính linh hoạt cùng MadK Store</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-200/60 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Product mini header */}
        <div className="p-4 px-6 bg-blue-50/50 border-b border-blue-100 flex items-center gap-3">
          {productImage && (
            <img src={productImage} alt="" className="w-12 h-12 rounded-xl object-cover bg-white border border-blue-200" />
          )}
          <div className="flex-1">
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">{productName}</h4>
            <div className="text-sm font-black text-blue-700 mt-0.5">{formatVND(productPrice)}</div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Method Selector Tabs */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              1. Chọn hình thức trả góp
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('credit_card')}
                className={`p-3.5 rounded-2.5xl text-left border transition-all ${
                  method === 'credit_card'
                    ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs sm:text-sm">Thẻ Tín Dụng (Credit Card)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    0% LÃI SUẤT
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Qua 25+ ngân hàng liên kết, xét duyệt tự động tức thì</p>
              </button>

              <button
                type="button"
                onClick={() => setMethod('finance')}
                className={`p-3.5 rounded-2.5xl text-left border transition-all ${
                  method === 'finance'
                    ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs sm:text-sm">Công ty Tài chính</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    CHỈ CẦN CCCD
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Home Credit, FE Credit, HD SAISON duyệt hồ sơ trong 15 phút</p>
              </button>
            </div>
          </div>

          {/* Partner Picker */}
          {method === 'credit_card' ? (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                2. Chọn ngân hàng phát hành thẻ
              </label>
              <div className="flex flex-wrap gap-2">
                {banks.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBank(b)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      selectedBank === b
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                2. Chọn đơn vị tài chính
              </label>
              <div className="flex flex-wrap gap-2">
                {finances.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setSelectedFinance(f)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedFinance === f
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Prepayment & Term Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                3. Số tiền trả trước
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[0, 20, 30, 40, 50, 70].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setPrepayPercent(pct)}
                    className={`flex-1 min-w-[50px] py-2 rounded-xl text-xs font-bold border text-center transition-all ${
                      prepayPercent === pct
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              <div className="mt-2 text-xs text-slate-600 font-semibold">
                Trả trước: <span className="text-blue-700 font-bold">{formatVND(prepayAmount)}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                4. Kỳ hạn trả góp
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[3, 6, 9, 12].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTermMonths(m)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border text-center transition-all ${
                      termMonths === m
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {m} tháng
                  </button>
                ))}
              </div>
              <div className="mt-2 text-xs text-slate-600 font-semibold">
                Vay lại: <span className="text-slate-900 font-bold">{formatVND(loanAmount)}</span>
              </div>
            </div>
          </div>

          {/* Breakdown summary calculation card */}
          <div className="p-5 rounded-3xl bg-slate-950 text-white space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs text-slate-400">Góp mỗi tháng (ước tính)</span>
              <span className="text-2xl font-black text-amber-400">
                {formatVND(monthlyPayment)}
                <span className="text-xs font-normal text-slate-400">/tháng</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Số tiền trả trước:</span>
                <span className="font-bold text-white mt-0.5 block">{formatVND(prepayAmount)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Tổng tiền phải trả:</span>
                <span className="font-bold text-white mt-0.5 block">{formatVND(totalPaid)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Chênh lệch so với giá gốc:</span>
                <span className="font-bold text-emerald-400 mt-0.5 block">
                  +{formatVND(difference)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex items-center gap-2">
              <span>📋</span>
              <span>
                {method === 'credit_card'
                  ? 'Yêu cầu: Hạn mức thẻ khả dụng lớn hơn số tiền vay. Quẹt thẻ online an toàn 100%.'
                  : 'Yêu cầu: CCCD gắn chip (từ 18-60 tuổi), duyệt online chỉ mất 15 phút không gọi người thân.'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Hỗ trợ tư vấn trả góp: <strong className="text-blue-600">1900 8888</strong>
          </div>

          {registered ? (
            <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <span>✓</span>
              <span>Đã tiếp nhận yêu cầu! Nhân viên sẽ gọi tư vấn sau 5 phút.</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRegistered(true)}
              className="px-6 py-3 rounded-2.5xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 hover:scale-102 active:scale-98 transition-all"
            >
              Đăng ký trả góp ngay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
