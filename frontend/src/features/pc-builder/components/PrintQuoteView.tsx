import React from 'react';
import { SelectedPart } from '../types';
import { COMPONENT_SLOTS } from '../pcBuilderData';
import { formatVND } from '../../../utils/format';

interface PrintQuoteViewProps {
  selectedParts: Partial<Record<string, SelectedPart>>;
  totalPrice: number;
  onClose: () => void;
}

export const PrintQuoteView: React.FC<PrintQuoteViewProps> = ({
  selectedParts,
  totalPrice,
  onClose,
}) => {
  const currentDate = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const quoteNumber = `MK-PC-${Date.now().toString().slice(-6)}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md p-4 sm:p-8 flex justify-center">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-10 shadow-2xl flex flex-col justify-between my-auto text-slate-800 print:p-0 print:shadow-none print:m-0 print:max-w-none">
        {/* Print controls (hidden in actual print output) */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Bảng báo giá cấu hình sẵn sàng in / lưu PDF
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all"
            >
              <span>🖨️</span>
              <span>In báo giá / Lưu PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>

        {/* Header of Quotation */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-black text-2xl tracking-tight text-slate-900">
                MadK<span className="text-blue-600">Store</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 uppercase">
                PC BUILDER PRO
              </span>
            </div>
            <p className="text-xs text-slate-500">Hệ thống phân phối linh kiện máy tính & Gaming Gear chính hãng</p>
            <p className="text-xs text-slate-500 mt-0.5">Hotline: 1900 8888 &bull; Website: https://mad-k-store.vercel.app</p>
          </div>

          <div className="text-right text-xs">
            <div className="font-bold text-slate-900 text-sm">BẢNG BÁO GIÁ LINH KIỆN</div>
            <div className="text-slate-500 mt-1">Mã báo giá: <strong className="text-slate-700">{quoteNumber}</strong></div>
            <div className="text-slate-500">Ngày lập: {currentDate}</div>
            <div className="text-slate-500">Hiệu lực: 03 ngày</div>
          </div>
        </div>

        {/* Table of selected components */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-y border-slate-200 text-slate-700">
                <th className="py-2.5 px-3 font-bold">STT</th>
                <th className="py-2.5 px-3 font-bold">Loại linh kiện</th>
                <th className="py-2.5 px-3 font-bold">Tên sản phẩm & Thông số</th>
                <th className="py-2.5 px-3 font-bold text-center">Bảo hành</th>
                <th className="py-2.5 px-3 font-bold text-center">Số lượng</th>
                <th className="py-2.5 px-3 font-bold text-right">Đơn giá</th>
                <th className="py-2.5 px-3 font-bold text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COMPONENT_SLOTS.map((slot, idx) => {
                const part = selectedParts[slot.id];
                if (!part) return null;
                return (
                  <tr key={slot.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-semibold text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-slate-700">{slot.name}</td>
                    <td className="py-3 px-3 font-medium text-slate-900">
                      <div>{part.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {part.sku}</div>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600">
                      {part.specs?.warrantyMonths ? `${part.specs.warrantyMonths} Tháng` : '36 Tháng'}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">{part.quantity}</td>
                    <td className="py-3 px-3 text-right text-slate-600 font-medium">
                      {formatVND(part.price)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-blue-700">
                      {formatVND(part.price * part.quantity)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Total Summary */}
        <div className="border-t-2 border-slate-900 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="text-xs text-slate-500 space-y-1">
            <p>• Giá trên đã bao gồm thuế VAT 10% và công lắp ráp máy miễn phí.</p>
            <p>• Tặng gói cài đặt hệ điều hành, driver và vệ sinh máy trọn đời tại MadK Store.</p>
            <p>• Đổi mới linh kiện trong 30 ngày đầu nếu phát sinh lỗi kỹ thuật của nhà sản xuất.</p>
          </div>

          <div className="text-right sm:min-w-[260px] bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 block">TỔNG CỘNG THANH TOÁN</span>
            <span className="text-2xl font-black text-blue-700 block mt-1">
              {formatVND(totalPrice)}
            </span>
            <span className="text-[11px] text-slate-400 italic">Đã gồm VAT & vận chuyển GHN</span>
          </div>
        </div>

        {/* Footer of Quotation */}
        <div className="grid grid-cols-2 text-center text-xs pt-6 border-t border-slate-200">
          <div>
            <span className="font-bold text-slate-800 block">KHÁCH HÀNG</span>
            <span className="text-slate-400 italic text-[11px] block mt-1">(Ký & ghi rõ họ tên)</span>
            <div className="h-16"></div>
          </div>
          <div>
            <span className="font-bold text-slate-800 block">ĐẠI DIỆN MADK STORE</span>
            <span className="text-slate-400 italic text-[11px] block mt-1">(Xác nhận & đóng dấu)</span>
            <div className="h-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
