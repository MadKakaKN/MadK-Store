import React, { useState, useEffect, useRef, useCallback } from 'react';

export type SwitchType = 'linear' | 'tactile' | 'clicky' | 'silent';
export type KeycapMaterial = 'pbt' | 'abs';

interface KeyboardSoundTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle?: string;
  defaultSwitch?: SwitchType;
  onSelectSwitchVariant?: (switchName: string) => void;
}

interface SwitchInfo {
  id: SwitchType;
  name: string;
  colorName: string;
  badgeColor: string;
  icon: string;
  travel: string;
  actuation: string;
  soundProfile: string;
  feel: string;
  recommendation: string;
}

const SWITCH_OPTIONS: SwitchInfo[] = [
  {
    id: 'linear',
    name: 'Red / Yellow (Linear)',
    colorName: 'Đỏ / Vàng',
    badgeColor: 'bg-rose-500 text-white',
    icon: '🔴',
    travel: '4.0 mm',
    actuation: '45g (Nhẹ & Êm)',
    soundProfile: 'Thocky trầm ấm, mượt mà, không tiếng click',
    feel: 'Trơn tuột từ đầu tới cuối, không có khấc',
    recommendation: 'Lựa chọn số 1 cho Game thủ thi đấu, gõ nhanh không mỏi tay',
  },
  {
    id: 'tactile',
    name: 'Brown / Panda (Tactile)',
    colorName: 'Nâu / Panda',
    badgeColor: 'bg-amber-600 text-white',
    icon: '🟤',
    travel: '4.0 mm',
    actuation: '55g (Vừa tay)',
    soundProfile: 'Âm đầm ấm, tiếng chạm đáy chắc nịch',
    feel: 'Có một khấc gờ nhẹ báo hiệu đã nhận phím',
    recommendation: 'Cân bằng hoàn hảo giữa Lập trình viên & Gõ văn bản',
  },
  {
    id: 'clicky',
    name: 'Blue / Green (Clicky)',
    colorName: 'Xanh dương',
    badgeColor: 'bg-blue-600 text-white',
    icon: '🔵',
    travel: '4.0 mm',
    actuation: '60g (Nặng tay)',
    soundProfile: 'Clicky giòn tan, thanh thoát, đanh thép',
    feel: 'Khấc cơ học rõ rệt, âm thanh vui tai đanh thép',
    recommendation: 'Dành cho người thích cảm giác cơ học hoài niệm, làm việc phòng riêng',
  },
  {
    id: 'silent',
    name: 'Silent Red / Black',
    colorName: 'Silent êm ái',
    badgeColor: 'bg-slate-600 text-white',
    icon: '⚪',
    travel: '3.7 mm',
    actuation: '45g',
    soundProfile: 'Siêu êm, giảm chấn triệt tiêu âm thanh',
    feel: 'Đệm cao su hãm xung, không gây tiếng ồn',
    recommendation: 'Hoàn hảo cho môi trường văn phòng, stream đêm, phòng ngủ',
  },
];

// Virtual Keyboard layout matrix
const KEYBOARD_ROWS = [
  [
    { code: 'Escape', label: 'ESC', width: 'w-10' },
    { code: 'Digit1', label: '1' },
    { code: 'Digit2', label: '2' },
    { code: 'Digit3', label: '3' },
    { code: 'Digit4', label: '4' },
    { code: 'Digit5', label: '5' },
    { code: 'Digit6', label: '6' },
    { code: 'Digit7', label: '7' },
    { code: 'Digit8', label: '8' },
    { code: 'Digit9', label: '9' },
    { code: 'Digit0', label: '0' },
    { code: 'Minus', label: '-' },
    { code: 'Equal', label: '=' },
    { code: 'Backspace', label: '⌫ BACK', width: 'w-16' },
  ],
  [
    { code: 'Tab', label: 'TAB', width: 'w-14' },
    { code: 'KeyQ', label: 'Q' },
    { code: 'KeyW', label: 'W' },
    { code: 'KeyE', label: 'E' },
    { code: 'KeyR', label: 'R' },
    { code: 'KeyT', label: 'T' },
    { code: 'KeyY', label: 'Y' },
    { code: 'KeyU', label: 'U' },
    { code: 'KeyI', label: 'I' },
    { code: 'KeyO', label: 'O' },
    { code: 'KeyP', label: 'P' },
    { code: 'BracketLeft', label: '[' },
    { code: 'BracketRight', label: ']' },
    { code: 'Backslash', label: '\\', width: 'w-12' },
  ],
  [
    { code: 'CapsLock', label: 'CAPS', width: 'w-16' },
    { code: 'KeyA', label: 'A' },
    { code: 'KeyS', label: 'S' },
    { code: 'KeyD', label: 'D' },
    { code: 'KeyF', label: 'F' },
    { code: 'KeyG', label: 'G' },
    { code: 'KeyH', label: 'H' },
    { code: 'KeyJ', label: 'J' },
    { code: 'KeyK', label: 'K' },
    { code: 'KeyL', label: 'L' },
    { code: 'Semicolon', label: ';' },
    { code: 'Quote', label: "'" },
    { code: 'Enter', label: 'ENTER ↵', width: 'w-20' },
  ],
  [
    { code: 'ShiftLeft', label: '⇧ SHIFT', width: 'w-20' },
    { code: 'KeyZ', label: 'Z' },
    { code: 'KeyX', label: 'X' },
    { code: 'KeyC', label: 'C' },
    { code: 'KeyV', label: 'V' },
    { code: 'KeyB', label: 'B' },
    { code: 'KeyN', label: 'N' },
    { code: 'KeyM', label: 'M' },
    { code: 'Comma', label: ',' },
    { code: 'Period', label: '.' },
    { code: 'Slash', label: '/' },
    { code: 'ShiftRight', label: '⇧ SHIFT', width: 'w-20' },
  ],
  [
    { code: 'ControlLeft', label: 'CTRL', width: 'w-12' },
    { code: 'MetaLeft', label: 'WIN', width: 'w-10' },
    { code: 'AltLeft', label: 'ALT', width: 'w-10' },
    { code: 'Space', label: '═══════ SPACEBAR (THOCK) ═══════', width: 'flex-1 min-w-[180px]' },
    { code: 'AltRight', label: 'ALT', width: 'w-10' },
    { code: 'Fn', label: 'FN', width: 'w-10' },
    { code: 'ControlRight', label: 'CTRL', width: 'w-12' },
  ],
];

export const KeyboardSoundTestModal: React.FC<KeyboardSoundTestModalProps> = ({
  isOpen,
  onClose,
  productTitle = 'Bàn phím cơ cao cấp',
  defaultSwitch = 'linear',
  onSelectSwitchVariant,
}) => {
  const [selectedSwitch, setSelectedSwitch] = useState<SwitchType>(defaultSwitch);
  const [keycapMaterial, setKeycapMaterial] = useState<KeycapMaterial>('pbt');
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [strokeCount, setStrokeCount] = useState<number>(0);
  const [recentText, setRecentText] = useState<string>('Gõ thử phím thật của bạn ngay tại đây...');
  const [wpm, setWpm] = useState<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const keystrokeTimestampsRef = useRef<number[]>([]);

  // Khởi tạo AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Web Audio Procedural Synthesis: Mô phỏng âm thanh vật lý của phím cơ
  const playMechanicalSound = useCallback(
    (isSpacebar = false) => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        // 1. Âm chạm đáy đáy phím (Bottom-out Thock / Clack)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // 2. Tiếng ma sát bề mặt (Noise burst)
        const bufferSize = ctx.sampleRate * 0.05; // 50ms buffer
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseFilter = ctx.createBiquadFilter();
        const noiseGain = ctx.createGain();

        // Cấu hình âm sắc tùy theo loại Switch
        if (selectedSwitch === 'clicky') {
          // Blue Switch: Tiếng click kim loại sắc bén + đanh thép
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(isSpacebar ? 420 : 680, now);
          osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(isSpacebar ? 1400 : 2800, now);
          filter.Q.setValueAtTime(3.5, now);

          // Clicky click impulse
          noiseFilter.type = 'highpass';
          noiseFilter.frequency.setValueAtTime(isSpacebar ? 2800 : 4200, now);

          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

          noiseGain.gain.setValueAtTime(0.4, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        } else if (selectedSwitch === 'tactile') {
          // Brown Switch: Âm đầm có khấc
          osc.type = 'sine';
          osc.frequency.setValueAtTime(isSpacebar ? 220 : 380, now);
          osc.frequency.exponentialRampToValueAtTime(90, now + 0.07);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(keycapMaterial === 'pbt' ? 950 : 1300, now);

          noiseFilter.type = 'bandpass';
          noiseFilter.frequency.setValueAtTime(1800, now);

          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

          noiseGain.gain.setValueAtTime(0.18, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        } else if (selectedSwitch === 'silent') {
          // Silent Switch: Tiếng êm ái, bọc đệm cao su
          osc.type = 'sine';
          osc.frequency.setValueAtTime(isSpacebar ? 160 : 240, now);
          osc.frequency.exponentialRampToValueAtTime(60, now + 0.04);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(350, now);

          noiseGain.gain.setValueAtTime(0.03, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        } else {
          // Linear Switch (Red/Yellow): Âm Thock sâu, trầm ấm
          osc.type = 'triangle';
          // Spacebar âm trầm hơn nhiều do thanh cân bằng stabilizer
          const baseFreq = isSpacebar ? 180 : 310;
          osc.frequency.setValueAtTime(baseFreq, now);
          osc.frequency.exponentialRampToValueAtTime(70, now + 0.075);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(keycapMaterial === 'pbt' ? 700 : 1100, now); // PBT thocky trầm hơn ABS

          noiseFilter.type = 'bandpass';
          noiseFilter.frequency.setValueAtTime(isSpacebar ? 900 : 1400, now);

          gain.gain.setValueAtTime(isSpacebar ? 0.45 : 0.32, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

          noiseGain.gain.setValueAtTime(0.12, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        }

        // Kết nối mạch âm thanh
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);

        noise.start(now);
        noise.stop(now + 0.06);
      } catch {
        // Fallback im lặng nếu trình duyệt chặn audio
      }
    },
    [getAudioContext, selectedSwitch, keycapMaterial]
  );

  // Kích hoạt phím
  const triggerKey = useCallback(
    (code: string, label?: string) => {
      setActiveKeys((prev) => new Set(prev).add(code));
      setStrokeCount((prev) => prev + 1);

      const isSpace = code === 'Space' || label?.includes('SPACE');
      playMechanicalSound(isSpace);

      // Cập nhật text demo
      if (label && label.length === 1) {
        setRecentText((prev) => (prev.length > 35 ? label : prev + label));
      }

      // Tính toán tốc độ gõ (WPM / CPM)
      const now = Date.now();
      keystrokeTimestampsRef.current.push(now);
      keystrokeTimestampsRef.current = keystrokeTimestampsRef.current.filter((t) => now - t <= 5000); // 5s window
      const countInWindow = keystrokeTimestampsRef.current.length;
      const estimatedWpm = Math.round((countInWindow / 5) * 60 * 0.2);
      setWpm(estimatedWpm);

      // Tự nhả hiệu ứng sau 120ms
      setTimeout(() => {
        setActiveKeys((prev) => {
          const next = new Set(prev);
          next.delete(code);
          return next;
        });
      }, 130);
    },
    [playMechanicalSound]
  );

  // Lắng nghe sự kiện bàn phím máy tính thật khi Modal mở
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua nếu đang bấm phím tắt F12, Ctrl+R, etc.
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.code === 'Escape') {
        onClose();
        return;
      }

      e.preventDefault();
      triggerKey(e.code, e.key.toUpperCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, triggerKey, onClose]);

  if (!isOpen) return null;

  const currentSwitchInfo = SWITCH_OPTIONS.find((s) => s.id === selectedSwitch) || SWITCH_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3.5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-indigo-600 to-cyan-400 p-0.5 shadow-md">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-xl">
                🎧
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Phòng Thử Âm Bàn Phím Cơ (Sound Test Studio)
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Web Audio HD
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Gõ trực tiếp trên bàn phím máy tính của bạn để nghe âm thanh thực tế
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Switch Selector Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>1. Chọn loại Switch cần nghe thử:</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Số lần gõ thử: <strong className="text-white">{strokeCount}</strong> phím
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SWITCH_OPTIONS.map((sw) => (
                <button
                  key={sw.id}
                  type="button"
                  onClick={() => setSelectedSwitch(sw.id)}
                  className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                    selectedSwitch === sw.id
                      ? 'bg-slate-800 border-blue-500 shadow-md ring-2 ring-blue-500/40 text-white'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">{sw.icon}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                        selectedSwitch === sw.id ? sw.badgeColor : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {sw.colorName}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-white block mt-1">{sw.name}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{sw.soundProfile}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Keycap Material Toggle & WPM Meter */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">Chất liệu Keycap:</span>
              <div className="inline-flex bg-slate-900 p-0.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setKeycapMaterial('pbt')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    keycapMaterial === 'pbt'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  PBT (Thock trầm ấm)
                </button>
                <button
                  type="button"
                  onClick={() => setKeycapMaterial('abs')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    keycapMaterial === 'abs'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ABS (Đanh & Sáng)
                </button>
              </div>
            </div>

            {/* Live Typing Speed */}
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-slate-400">Tốc độ gõ:</span>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-xl border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-emerald-400 text-sm">{wpm}</span>
                <span className="text-[10px] text-slate-400">WPM</span>
              </div>
            </div>
          </div>

          {/* Interactive Keyboard Visual Canvas */}
          <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-950 to-slate-900 rounded-3xl border border-slate-800 shadow-inner space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 px-1">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                <span>Bấm trực tiếp phím vật lý trên bàn phím của bạn hoặc click chuột vào phím:</span>
              </span>
              <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px]">
                {currentSwitchInfo.name}
              </span>
            </div>

            {/* Keyboard Grid */}
            <div className="space-y-1.5 select-none overflow-x-auto pb-1">
              {KEYBOARD_ROWS.map((row, rIdx) => (
                <div key={rIdx} className="flex gap-1.5 justify-center min-w-[620px]">
                  {row.map((k) => {
                    const isPressed = activeKeys.has(k.code);
                    const isSpace = k.code === 'Space';

                    return (
                      <button
                        key={k.code}
                        type="button"
                        onMouseDown={() => triggerKey(k.code, k.label)}
                        className={`h-10 sm:h-11 rounded-xl text-[11px] font-bold transition-all duration-75 flex items-center justify-center shadow-md relative overflow-hidden ${
                          k.width || 'w-10 sm:w-11'
                        } ${
                          isPressed
                            ? 'bg-gradient-to-b from-blue-500 to-indigo-600 text-white translate-y-1 shadow-inner ring-2 ring-blue-300'
                            : isSpace
                            ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-b-3 border-slate-950 hover:border-slate-900'
                            : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-b-3 border-slate-950 hover:border-slate-900'
                        }`}
                      >
                        <span className="relative z-10 truncate px-1">{k.label}</span>
                        {isPressed && (
                          <div className="absolute inset-0 bg-white/20 animate-ping pointer-events-none" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Live Typing Sandbox Preview */}
            <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
              <span className="text-slate-400">Văn bản vừa gõ:</span>
              <span className="font-mono text-emerald-300 font-semibold tracking-wide truncate max-w-[450px]">
                {recentText}
              </span>
            </div>
          </div>

          {/* Switch Technical Breakdown Box */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Đặc tính âm thanh:</span>
              <span className="font-bold text-white mt-0.5 block">{currentSwitchInfo.soundProfile}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Hành trình & Lực nhấn:</span>
              <span className="font-bold text-white mt-0.5 block">
                {currentSwitchInfo.travel} • {currentSwitchInfo.actuation}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Phù hợp nhất với:</span>
              <span className="font-bold text-cyan-300 mt-0.5 block">{currentSwitchInfo.recommendation}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Đang thử cho:</span>
            <strong className="text-white truncate max-w-[280px]">{productTitle}</strong>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors w-full sm:w-auto"
            >
              Đóng phòng thử âm
            </button>
            {onSelectSwitchVariant && (
              <button
                type="button"
                onClick={() => {
                  onSelectSwitchVariant(currentSwitchInfo.name);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg transition-all w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <span>✓</span>
                <span>Chọn Switch {currentSwitchInfo.colorName}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
