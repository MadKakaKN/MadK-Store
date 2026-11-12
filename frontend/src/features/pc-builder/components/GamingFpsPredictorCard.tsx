import React, { useState, useMemo } from 'react';
import { SelectedPart, ComponentSlotId } from '../types';

interface GamingFpsPredictorCardProps {
  selectedParts: Partial<Record<ComponentSlotId, SelectedPart>>;
}

interface GameConfig {
  id: string;
  name: string;
  icon: string;
  genre: string;
  engine: string;
  baseFps: number; // Base FPS on reference mid-range build (i5 + RTX 4060 at 1080p High)
  cpuWeight: number; // 0 to 1
  gpuWeight: number; // 0 to 1
  minFpsTarget: number;
}

const POPULAR_GAMES: GameConfig[] = [
  {
    id: 'wukong',
    name: 'Black Myth: Wukong',
    icon: '🐒',
    genre: 'Action RPG (UE5)',
    engine: 'Unreal Engine 5.4',
    baseFps: 65,
    cpuWeight: 0.25,
    gpuWeight: 0.75,
    minFpsTarget: 60,
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk 2077',
    icon: '🌆',
    genre: 'Sci-Fi RPG (Ray Tracing)',
    engine: 'REDengine 4',
    baseFps: 72,
    cpuWeight: 0.35,
    gpuWeight: 0.65,
    minFpsTarget: 60,
  },
  {
    id: 'cs2',
    name: 'Counter-Strike 2',
    icon: '🎯',
    genre: 'Competitive FPS',
    engine: 'Source 2',
    baseFps: 185,
    cpuWeight: 0.55,
    gpuWeight: 0.45,
    minFpsTarget: 144,
  },
  {
    id: 'valorant',
    name: 'Valorant',
    icon: '⚡',
    genre: 'Esports Shooter',
    engine: 'Unreal Engine 4',
    baseFps: 260,
    cpuWeight: 0.65,
    gpuWeight: 0.35,
    minFpsTarget: 144,
  },
  {
    id: 'gta5',
    name: 'Grand Theft Auto V',
    icon: '🚗',
    genre: 'Open World Action',
    engine: 'RAGE Engine',
    baseFps: 130,
    cpuWeight: 0.45,
    gpuWeight: 0.55,
    minFpsTarget: 75,
  },
  {
    id: 'eldenring',
    name: 'Elden Ring',
    icon: '⚔️',
    genre: 'Souls-like RPG',
    engine: 'FromSoftware Engine',
    baseFps: 60,
    cpuWeight: 0.35,
    gpuWeight: 0.65,
    minFpsTarget: 60,
  },
];

type Resolution = '1080p' | '1440p' | '2160p';
type GraphicPreset = 'medium' | 'high' | 'ultra';

export const GamingFpsPredictorCard: React.FC<GamingFpsPredictorCardProps> = ({ selectedParts }) => {
  const [selectedGameId, setSelectedGameId] = useState<string>('wukong');
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [preset, setPreset] = useState<GraphicPreset>('high');

  const cpu = selectedParts.cpu;
  const vga = selectedParts.vga;

  // 1. Phân tích sức mạnh CPU (Thang điểm 10 - 100)
  const cpuScore = useMemo(() => {
    if (!cpu) return 40; // Default baseline if not selected
    const name = cpu.name.toLowerCase();

    if (name.includes('i9-14') || name.includes('i9-13') || name.includes('7800x3d') || name.includes('7950x') || name.includes('9950x')) return 98;
    if (name.includes('i7-14') || name.includes('i7-13') || name.includes('7700x') || name.includes('9700x') || name.includes('5800x3d')) return 88;
    if (name.includes('i5-14600') || name.includes('i5-13600') || name.includes('7600x') || name.includes('9600x')) return 80;
    if (name.includes('i5-14400') || name.includes('i5-13400') || name.includes('i5-12600') || name.includes('5700x')) return 72;
    if (name.includes('i5-12400') || name.includes('i5-11400') || name.includes('5600') || name.includes('3600')) return 62;
    if (name.includes('i3-14') || name.includes('i3-13') || name.includes('i3-12') || name.includes('3300x') || name.includes('4100')) return 48;
    if (name.includes('i3-10') || name.includes('i7-8') || name.includes('i7-9') || name.includes('ryzen 3')) return 38;

    return 60; // Mặc định tầm trung
  }, [cpu]);

  // 2. Phân tích sức mạnh VGA / GPU (Thang điểm 10 - 100)
  const gpuScore = useMemo(() => {
    if (!vga) return 20; // Default integrated/no dedicated GPU
    const name = vga.name.toLowerCase();

    if (name.includes('4090')) return 100;
    if (name.includes('4080') || name.includes('7900 xtx')) return 90;
    if (name.includes('4070 ti') || name.includes('7900 xt')) return 82;
    if (name.includes('4070 super') || name.includes('7800 xt')) return 76;
    if (name.includes('4070') || name.includes('3080 ti') || name.includes('3080')) return 70;
    if (name.includes('4060 ti') || name.includes('3070 ti') || name.includes('3070') || name.includes('6750 xt')) return 62;
    if (name.includes('4060') || name.includes('3060 ti') || name.includes('7600') || name.includes('6600 xt')) return 52;
    if (name.includes('3060') || name.includes('2060 super') || name.includes('6600') || name.includes('a770')) return 45;
    if (name.includes('3050') || name.includes('1660') || name.includes('2060') || name.includes('a580')) return 35;
    if (name.includes('1650') || name.includes('1060') || name.includes('rx 580') || name.includes('rx 570')) return 26;
    if (name.includes('1050') || name.includes('1030') || name.includes('rx 550')) return 18;

    return 50; // Mặc định tầm trung
  }, [vga]);

  // 3. Tính toán FPS dự kiến cho Game đang chọn
  const activeGame = useMemo(() => {
    return POPULAR_GAMES.find((g) => g.id === selectedGameId) || POPULAR_GAMES[0];
  }, [selectedGameId]);

  const { estimatedFps, fpsRating } = useMemo(() => {
    const resMultiplier = resolution === '1080p' ? 1.0 : resolution === '1440p' ? 0.68 : 0.42;
    const presetMultiplier = preset === 'medium' ? 1.25 : preset === 'high' ? 1.0 : 0.82;

    // Chuẩn hóa điểm tổng hợp theo trọng số game
    const blendedScore = (cpuScore * activeGame.cpuWeight + gpuScore * activeGame.gpuWeight) / 52; // 52 là điểm chuẩn RTX 4060 + i5
    let rawFps = Math.round(activeGame.baseFps * blendedScore * resMultiplier * presetMultiplier);

    // Áp dụng giới hạn thực tế cho engine game
    if (activeGame.id === 'eldenring' && rawFps > 60) rawFps = 60; // Elden ring lock 60 fps
    if (rawFps < 12) rawFps = 12;

    let rating = 'Mượt mà';

    if (rawFps >= 144) {
      rating = 'Siêu mượt 144Hz+ (Chuẩn eSports)';
    } else if (rawFps >= 90) {
      rating = 'Rất mượt (90 - 144 FPS)';
    } else if (rawFps >= 60) {
      rating = 'Mượt mà chuẩn điện ảnh (60 - 90 FPS)';
    } else if (rawFps >= 40) {
      rating = 'Chơi ổn định (40 - 60 FPS)';
    } else {
      rating = 'Khung hình thấp (< 40 FPS, nên hạ cấu hình)';
    }

    return { estimatedFps: rawFps, fpsRating: rating };
  }, [activeGame, cpuScore, gpuScore, resolution, preset]);

  // 4. Tính toán Nghẽn Cổ Chai (Bottleneck Calculation)
  const bottleneckInfo = useMemo(() => {
    // Điều chỉnh độ nhạy nghẽn theo độ phân giải:
    // Ở 1080p, CPU ảnh hưởng lớn hơn; Ở 4K, GPU gánh 90% tải
    const adjustedCpu = resolution === '1080p' ? cpuScore : resolution === '1440p' ? cpuScore * 1.15 : cpuScore * 1.35;
    const adjustedGpu = resolution === '1080p' ? gpuScore * 1.1 : gpuScore;

    const diff = adjustedGpu - adjustedCpu;
    const maxVal = Math.max(adjustedCpu, adjustedGpu);
    const percentage = Math.min(Math.round((Math.abs(diff) / maxVal) * 100), 45);

    if (percentage <= 8) {
      return {
        percentage,
        type: 'perfect' as const,
        label: 'Cân bằng hoàn hảo',
        badgeColor: 'bg-emerald-500 text-white',
        borderClass: 'border-emerald-200 bg-emerald-50/60',
        textColor: 'text-emerald-700',
        icon: '💎',
        explanation: `CPU và Card đồ họa (GPU) kết hợp cực kỳ đồng đều ở độ phân giải ${resolution}. Hiệu năng phần cứng được giải phóng 100%!`,
      };
    } else if (diff > 0) {
      // GPU mạnh hơn CPU đáng kể -> Nghẽn CPU
      const isSevere = percentage > 18;
      return {
        percentage,
        type: 'cpu_bottleneck' as const,
        label: `Nghẽn CPU (~${percentage}%)`,
        badgeColor: isSevere ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white',
        borderClass: isSevere ? 'border-rose-200 bg-rose-50/60' : 'border-amber-200 bg-amber-50/60',
        textColor: isSevere ? 'text-rose-700' : 'text-amber-700',
        icon: '⚠️',
        explanation: `Card đồ họa ${vga?.name ? `(${vga.name.slice(0, 25)})` : ''} rất mạnh nhưng CPU chưa xử lý kịp khung hình. ${
          isSevere ? 'Nên nâng cấp lên dòng CPU mạnh hơn để tránh giật lag khung hình (1% Low FPS).' : 'Mức nghẽn nhẹ, vẫn trải nghiệm game rất tốt.'
        }`,
      };
    } else {
      // CPU mạnh hơn GPU đáng kể -> Nghẽn GPU
      const isSevere = percentage > 18;
      return {
        percentage,
        type: 'gpu_bottleneck' as const,
        label: `Nghẽn GPU (~${percentage}%)`,
        badgeColor: isSevere ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white',
        borderClass: isSevere ? 'border-rose-200 bg-rose-50/60' : 'border-amber-200 bg-amber-50/60',
        textColor: isSevere ? 'text-rose-700' : 'text-amber-700',
        icon: '💡',
        explanation: `CPU của bạn thừa sức gánh các tác vụ nặng, nhưng Card màn hình hiện tại là giới hạn tốc độ dựng hình. ${
          isSevere ? 'Nên đầu tư thêm vào Card đồ họa để mở khóa đồ họa 2K / Ray Tracing.' : 'Cấu hình tối ưu rất tốt cho các tác vụ đa nhiệm & render.'
        }`,
      };
    }
  }, [cpuScore, gpuScore, resolution, vga]);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-card space-y-5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-lg shadow-sm">
            🎮
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Đo FPS & Nghẽn Cổ Chai</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                AI Bench
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Dự đoán khung hình game thực tế & độ cân đối CPU - GPU
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${bottleneckInfo.badgeColor}`}
        >
          <span>{bottleneckInfo.icon}</span>
          <span>{bottleneckInfo.label}</span>
        </span>
      </div>

      {/* Warning if parts are missing */}
      {(!cpu || !vga) && (
        <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
          <span className="text-sm">ℹ️</span>
          <span>
            {!cpu && !vga
              ? 'Hãy chọn CPU và Card đồ họa (VGA) trong danh sách để kết quả đo đạt độ chính xác cao nhất.'
              : !cpu
              ? 'Chưa chọn CPU. Đang dùng ước tính chuẩn cho vi xử lý tầm trung.'
              : 'Chưa chọn Card đồ họa (VGA). Đang ước tính theo đồ họa tích hợp.'}
          </span>
        </div>
      )}

      {/* Game Selector Chips */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-2">Chọn tựa game kiểm thử:</label>
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
          {POPULAR_GAMES.map((game) => (
            <button
              key={game.id}
              type="button"
              onClick={() => setSelectedGameId(game.id)}
              className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                selectedGameId === game.id
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base">{game.icon}</span>
                <span className="text-[11px] font-bold text-slate-900 truncate">{game.name}</span>
              </div>
              <span className="text-[9px] text-slate-500 line-clamp-1">{game.genre}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Resolution & Settings Selector Controls */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Độ phân giải màn hình:</label>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
            {(['1080p', '1440p', '2160p'] as Resolution[]).map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => setResolution(res)}
                className={`py-1 text-[11px] font-bold rounded-lg transition-all ${
                  resolution === res
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {res === '1080p' ? 'FHD' : res === '1440p' ? '2K' : '4K'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Thiết lập đồ họa:</label>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
            {(['medium', 'high', 'ultra'] as GraphicPreset[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPreset(p)}
                className={`py-1 text-[11px] font-bold rounded-lg transition-all ${
                  preset === p
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p === 'medium' ? 'Vừa' : p === 'high' ? 'Cao' : 'Ultra'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Big FPS Gauge Display */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-slate-800 relative overflow-hidden shadow-inner">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
              FPS Trung Bình Dự Kiến
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 tracking-tight">
                {estimatedFps}
              </span>
              <span className="text-xs font-bold text-slate-300 uppercase">FPS</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-300 block mt-1">
              {fpsRating}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Tựa game</span>
            <span className="text-xs font-bold text-white block">{activeGame.name}</span>
            <span className="text-[10px] text-indigo-300 font-mono mt-0.5 inline-block">
              {resolution} • {preset.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar Gauge */}
        <div className="mt-3.5 space-y-1">
          <div className="w-full bg-slate-800/90 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                estimatedFps >= 144
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                  : estimatedFps >= 60
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : estimatedFps >= 40
                  ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                  : 'bg-gradient-to-r from-rose-500 to-amber-500'
              }`}
              style={{ width: `${Math.min((estimatedFps / 240) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>30 FPS</span>
            <span>60 FPS (Chuẩn)</span>
            <span>144 FPS (Esports)</span>
            <span>240+ FPS</span>
          </div>
        </div>
      </div>

      {/* Bottleneck Analysis Details */}
      <div className={`p-3.5 rounded-2xl border ${bottleneckInfo.borderClass} space-y-2`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold ${bottleneckInfo.textColor} flex items-center gap-1.5`}>
            <span>{bottleneckInfo.icon}</span>
            <span>Đánh giá tương thích phần cứng:</span>
          </span>
          <span className="text-[11px] font-bold text-slate-700">
            Tỉ lệ nghẽn: <span className="font-mono">{bottleneckInfo.percentage}%</span>
          </span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          {bottleneckInfo.explanation}
        </p>

        {/* Mini component pairing badges */}
        <div className="pt-1.5 flex flex-wrap gap-2 text-[10px]">
          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium truncate max-w-[170px]">
            CPU: <strong>{cpu?.name ? cpu.name.slice(0, 22) : 'Chưa chọn'}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium truncate max-w-[170px]">
            VGA: <strong>{vga?.name ? vga.name.slice(0, 22) : 'Chưa chọn'}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
