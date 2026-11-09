import React from 'react';
import { SelectedPart, ComponentSlotId } from '../types';

interface WattageCalculatorCardProps {
  selectedParts: Partial<Record<ComponentSlotId, SelectedPart>>;
}

export const WattageCalculatorCard: React.FC<WattageCalculatorCardProps> = ({ selectedParts }) => {
  // Base consumption for motherboard, fans, RAM, SSD/HDD
  const BASE_WATTAGE = 75;

  const cpu = selectedParts.cpu;
  const vga = selectedParts.vga;
  const psu = selectedParts.psu;

  const cpuWatt = cpu?.specs?.tdpWatt || (cpu ? 100 : 0);
  const vgaWatt = vga?.specs?.tdpWatt || (vga ? 150 : 0);
  const otherPartsWatt = Object.keys(selectedParts).length > 2 ? BASE_WATTAGE : 30;

  const totalEstimatedWatt = cpuWatt + vgaWatt + otherPartsWatt;
  const recommendedPsuWatt = Math.ceil((totalEstimatedWatt * 1.35) / 50) * 50; // 35% headroom rounded to 50W

  const selectedPsuWatt = psu?.specs?.wattage || 0;

  let status: 'ok' | 'warning' | 'missing_psu' = 'missing_psu';
  let statusMessage = 'Chưa chọn Nguồn máy tính (PSU)';

  if (selectedPsuWatt > 0) {
    if (selectedPsuWatt < totalEstimatedWatt) {
      status = 'warning';
      statusMessage = `Nguồn ${selectedPsuWatt}W có thể bị quá tải khi CPU & GPU đạt đỉnh 100%! Cần tối thiểu ${recommendedPsuWatt}W.`;
    } else if (selectedPsuWatt < recommendedPsuWatt) {
      status = 'warning';
      statusMessage = `Nguồn ${selectedPsuWatt}W đủ chạy nhưng sát tải. Nên dùng từ ${recommendedPsuWatt}W để bộ nguồn bền và mát hơn.`;
    } else {
      status = 'ok';
      statusMessage = `Nguồn ${selectedPsuWatt}W hoàn hảo! Đảm bảo dư tải an toàn và ổn định linh kiện.`;
    }
  }

  // Compatibility checking
  const issues: string[] = [];

  const mainboard = selectedParts.mainboard;
  const ram = selectedParts.ram;

  if (cpu?.specs?.socket && mainboard?.specs?.socket) {
    if (cpu.specs.socket !== mainboard.specs.socket) {
      issues.push(
        `Không tương thích Socket: CPU dùng ${cpu.specs.socket} nhưng Bo mạch chủ lại hỗ trợ ${mainboard.specs.socket}.`
      );
    }
  }

  if (mainboard?.specs?.ramType && ram?.specs?.ramType) {
    if (!mainboard.specs.ramType.includes(ram.specs.ramType)) {
      issues.push(
        `Không tương thích chuẩn RAM: Bo mạch chủ dùng ${mainboard.specs.ramType} nhưng bạn đang chọn RAM ${ram.specs.ramType}.`
      );
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
            ⚡
          </span>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">Bộ tính toán công suất nguồn (PSU)</h4>
            <span className="text-[11px] text-slate-400">MadK Smart TDP Calculator</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block">Ước tính tiêu thụ</span>
          <span className="text-lg font-black text-amber-400">~{totalEstimatedWatt} W</span>
        </div>
      </div>

      {/* Progress meter */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-400 font-medium">
          <span>Công suất khuyến nghị: <strong className="text-white">{recommendedPsuWatt}W</strong></span>
          <span>Nguồn đã chọn: <strong className={selectedPsuWatt >= recommendedPsuWatt ? 'text-emerald-400' : selectedPsuWatt > 0 ? 'text-amber-400' : 'text-slate-400'}>{selectedPsuWatt > 0 ? `${selectedPsuWatt}W` : 'Chưa chọn'}</strong></span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              status === 'ok'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : status === 'warning'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                : 'bg-blue-500'
            }`}
            style={{
              width: `${Math.min(
                100,
                selectedPsuWatt > 0
                  ? (totalEstimatedWatt / selectedPsuWatt) * 100
                  : (totalEstimatedWatt / 850) * 100
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Status banner */}
      <div
        className={`p-3 rounded-2xl text-xs flex items-center gap-2.5 ${
          status === 'ok'
            ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
            : status === 'warning'
            ? 'bg-rose-950/60 border border-rose-500/30 text-rose-300'
            : 'bg-slate-800/80 border border-slate-700 text-slate-300'
        }`}
      >
        <span className="text-base flex-shrink-0">
          {status === 'ok' ? '✓' : status === 'warning' ? '⚠️' : 'ℹ️'}
        </span>
        <span className="leading-relaxed font-medium">{statusMessage}</span>
      </div>

      {/* Compatibility issues alert */}
      {issues.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-900/40 border border-rose-500/50 text-rose-200 text-xs space-y-1.5 animate-pulse">
          <div className="font-bold flex items-center gap-1.5 text-rose-300">
            <span>❌</span>
            <span>Phát hiện xung đột phần cứng!</span>
          </div>
          {issues.map((msg, i) => (
            <div key={i} className="pl-5 list-disc text-rose-200 leading-tight">
              • {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
