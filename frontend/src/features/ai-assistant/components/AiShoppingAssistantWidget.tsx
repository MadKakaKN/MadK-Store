import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import aiAssistantApi, {
  AiChatMessage,
  AiRecommendedProduct,
} from '../../../api/aiAssistantApi';
import catalogApi from '../../../api/catalogApi';
import { useCart } from '../../cart/context/CartContext';
import { useCompare } from '../../../context/CompareContext';
import { ProductListDto } from '../../../types/catalog';
import { formatVND } from '../../../utils/format';

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendedProducts?: AiRecommendedProduct[];
  timestamp: string;
}

// Icon Trợ lý Robot AI công nghệ cao cấp mới (Thay thế cho icon 3 ngôi sao cũ)
const AiRobotIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Ăng-ten phát tín hiệu */}
    <path d="M12 2v4" />
    <circle cx="12" cy="2" r="1.2" fill="currentColor" />
    {/* Đầu robot bo góc công nghệ */}
    <rect x="3" y="6" width="18" height="14" rx="4" fill="currentColor" fillOpacity="0.12" />
    {/* 2 Mắt robot công nghệ */}
    <circle cx="8.5" cy="12" r="1.8" fill="currentColor" />
    <circle cx="15.5" cy="12" r="1.8" fill="currentColor" />
    {/* Miệng cười thân thiện */}
    <path d="M9 16c1 1.2 5 1.2 6 0" />
    {/* Tai nghe 2 bên */}
    <path d="M2 11v4" />
    <path d="M22 11v4" />
  </svg>
);

export const AiShoppingAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [messages, setMessages] = useState<MessageItem[]>(() => {
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Xin chào! Tôi là **MadK AI Tech Assistant** 🤖\n\nTôi có thể giúp bạn phân tích thông số phần cứng, đối chiếu các mẫu Laptop, PC Đồ họa/Gaming, linh kiện máy tính, hoặc đề xuất thiết bị tối ưu theo mức ngân sách của bạn.\n\nBạn đang quan tâm đến sản phẩm hoặc phân khúc nào?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([
    'Tư vấn laptop gaming dưới 25 triệu',
    'Cấu hình PC thiết kế đồ họa & 3D',
    'Chuột không dây gaming siêu nhẹ',
    'Bàn phím cơ văn phòng gõ êm',
  ]);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const { addToCart } = useCart();
  const { isInCompare, toggleCompare } = useCompare();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Phát âm thanh nhẹ khi có tin nhắn mới (Web Audio API)
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Bỏ qua lỗi audio policy của trình duyệt
    }
  };

  // Tự động cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Lấy gợi ý câu hỏi từ API khi khởi động
  useEffect(() => {
    aiAssistantApi
      .getPrompts()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setPrompts(res.data);
        }
      })
      .catch(() => {
        // Giữ gợi ý mặc định nếu có lỗi
      });
  }, []);

  // Lắng nghe sự kiện mở box chat kèm prompt từ PC Builder / Sản phẩm
  useEffect(() => {
    const handleCustomPrompt = (event: Event) => {
      const customEvent = event as CustomEvent<{ prompt?: string }>;
      setIsOpen(true);
      if (customEvent.detail?.prompt) {
        handleSend(customEvent.detail.prompt);
      }
    };

    window.addEventListener('madk:open-ai-chat', handleCustomPrompt);
    return () => window.removeEventListener('madk:open-ai-chat', handleCustomPrompt);
  }, []);

  // Xử lý gửi tin nhắn
  const handleSend = async (messageToSend?: string) => {
    const text = (messageToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: MessageItem = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Chuẩn bị lịch sử hội thoại gần nhất
      const history: AiChatMessage[] = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await aiAssistantApi.chat({
        message: text,
        history,
      });

      const assistantMsg: MessageItem = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          res.data?.reply ||
          'Tôi đã tiếp nhận câu hỏi của bạn. Bạn vui lòng mô tả chi tiết hơn về nhu cầu (gaming, đồ họa, văn phòng) hoặc tầm giá để tôi tư vấn chuẩn xác nhất nhé!',
        recommendedProducts: res.data?.recommendedProducts || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      playChime();
    } catch {
      const errorMsg: MessageItem = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Xin lỗi, máy chủ tư vấn đang bận xử lý dữ liệu. Bạn vui lòng thử lại sau giây lát hoặc liên hệ hotline 0901.316.434 để được hỗ trợ tức thì nhé!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Thêm sản phẩm gợi ý vào giỏ hàng
  const handleAddRecommendedToCart = async (product: AiRecommendedProduct) => {
    try {
      const detail = await catalogApi.getProductBySlug(product.slug);
      if (detail && detail.variants && detail.variants.length > 0) {
        const variant = detail.variants[0];
        await addToCart(variant.id, 1, variant.salePrice || variant.originalPrice);
        setAddedProductId(product.id);
        setTimeout(() => setAddedProductId(null), 2500);
      }
    } catch (err) {
      console.error('Lỗi thêm sản phẩm gợi ý vào giỏ hàng:', err);
    }
  };

  // Thêm sản phẩm gợi ý vào danh sách so sánh
  const handleToggleCompare = (product: AiRecommendedProduct) => {
    const compareItem: ProductListDto = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      thumbnailUrl: product.thumbnailUrl,
      basePrice: product.basePrice,
      minPrice: product.minPrice || product.basePrice,
      maxPrice: product.basePrice,
      categoryId: '',
      categoryName: product.categoryName,
      categorySlug: '',
      brandId: '',
      brandName: product.brandName,
      brandSlug: '',
      isFeatured: false,
      createdAt: new Date().toISOString(),
    };
    toggleCompare(compareItem);
  };

  // Làm sạch lịch sử chat
  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Đã làm mới cuộc hội thoại. Hãy cho tôi biết nhu cầu sử dụng hoặc tầm ngân sách bạn mong muốn nhé!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Định dạng nội dung tin nhắn với Markdown và thẻ làm nổi bật
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed text-sm">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-2" />;

          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <p key={idx} className="text-slate-800">
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={pIdx} className="font-bold text-blue-600">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                if (part.startsWith('* ') || part.startsWith('- ')) {
                  return (
                    <span key={pIdx} className="inline-block pl-2 text-slate-700">
                      • {part.slice(2)}
                    </span>
                  );
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Nút bấm nổi kích hoạt Chatbot AI (Góc dưới bên phải) - ICON ROBOT AI MỚI */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-[0_8px_30px_rgba(37,99,235,0.45)] hover:shadow-[0_12px_45px_rgba(37,99,235,0.65)] hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white/80"
            title="Trò chuyện với Trợ lý AI MadK"
          >
            {/* Vòng sáng pulse animation */}
            <span className="absolute -inset-1 rounded-full bg-cyan-400 opacity-35 animate-ping pointer-events-none" />

            {/* Icon Robot AI mới */}
            <div className="relative z-10 transition-transform group-hover:scale-110 drop-shadow-sm">
              <AiRobotIcon className="w-7 h-7 text-white" />
            </div>

            {/* Tooltip khi rê chuột */}
            <span className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-semibold whitespace-nowrap shadow-xl border border-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Trợ lý Robot AI ✨
            </span>
          </button>
        )}
      </div>

      {/* Cửa sổ Chatbot AI - GIAO DIỆN MÀU SÁNG (LIGHT THEME) */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[94vw] sm:w-[440px] h-[640px] max-h-[86vh] bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.18)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-800">
          
          {/* Top highlight bar */}
          <div className="h-[3px] bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 shrink-0" />

          {/* Header màu sáng với Avatar Robot AI mới */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 border-b border-slate-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {/* Avatar tròn với Icon Robot AI mới */}
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 border border-white">
                <AiRobotIcon className="w-5 h-5 text-white" />
                {/* Trạng thái online */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-slate-900">MadK Neural AI</h3>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-blue-100 text-blue-700 border border-blue-200">
                    GEMINI
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <span className="text-emerald-600 font-semibold">● Trực tuyến 24/7</span>
                  <span>•</span>
                  <span>Tư vấn phần cứng & gaming</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              {/* Nút bật/tắt âm thanh */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Tắt âm thanh thông báo' : 'Bật âm thanh'}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  soundEnabled ? 'hover:bg-slate-100 hover:text-blue-600 text-slate-600' : 'text-slate-300 hover:text-slate-500'
                }`}
              >
                {soundEnabled ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  </svg>
                )}
              </button>

              {/* Nút xóa lịch sử */}
              <button
                type="button"
                onClick={handleClearChat}
                title="Làm mới cuộc trò chuyện"
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                </svg>
              </button>

              {/* Nút đóng */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ"
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors text-base"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Categories Bar */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200/70 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs shrink-0">
            <button
              type="button"
              onClick={() => handleSend('Tư vấn laptop gaming tầm 20 - 30 triệu')}
              className="px-2.5 py-1 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200/80 shadow-2xs whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 font-medium"
            >
              <span>🎮</span> Laptop Gaming
            </button>
            <button
              type="button"
              onClick={() => handleSend('Cấu hình PC thiết kế đồ họa & Render 3D')}
              className="px-2.5 py-1 rounded-xl bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-600 border border-slate-200/80 shadow-2xs whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 font-medium"
            >
              <span>🎨</span> PC Đồ họa
            </button>
            <button
              type="button"
              onClick={() => handleSend('Chuột gaming không dây siêu nhẹ cảm biến chuẩn')}
              className="px-2.5 py-1 rounded-xl bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-600 border border-slate-200/80 shadow-2xs whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 font-medium"
            >
              <span>🖱️</span> Chuột Gaming
            </button>
            <button
              type="button"
              onClick={() => handleSend('Bàn phím cơ văn phòng gõ êm ái, kết nối không dây')}
              className="px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 border border-slate-200/80 shadow-2xs whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 font-medium"
            >
              <span>⌨️</span> Phím cơ êm
            </button>
          </div>

          {/* Body tin nhắn */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-3xl shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs shadow-blue-500/15'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {renderFormattedText(msg.content)}
                  <span
                    className={`block text-[10px] text-right mt-1.5 opacity-70 ${
                      msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {/* Thẻ sản phẩm tương tác cao cấp */}
                {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                  <div className="mt-3 w-full space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                      <span>⚡</span> Sản phẩm gợi ý từ cơ sở dữ liệu MadK:
                    </p>
                    <div className="grid grid-cols-1 gap-2.5">
                      {msg.recommendedProducts.map((p) => {
                        const inCompare = isInCompare(p.id);
                        return (
                          <div
                            key={p.id}
                            className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-3 shadow-xs hover:shadow-md transition-all"
                          >
                            <div className="flex gap-3">
                              <Link
                                to={`/products/${p.slug}`}
                                onClick={() => setIsOpen(false)}
                                className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-xl p-1.5 shrink-0 overflow-hidden flex items-center justify-center hover:scale-105 transition-transform"
                              >
                                <img
                                  src={p.thumbnailUrl || `/images/products/${p.slug}.png`}
                                  alt={p.name}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/images/products/placeholder.png';
                                  }}
                                />
                              </Link>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                                    {p.brandName} • {p.categoryName}
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-600">Chính hãng</span>
                                </div>
                                <Link
                                  to={`/products/${p.slug}`}
                                  onClick={() => setIsOpen(false)}
                                  className="font-bold text-xs text-slate-900 hover:text-blue-600 truncate block transition-colors"
                                  title={p.name}
                                >
                                  {p.name}
                                </Link>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-extrabold text-blue-600">
                                    {formatVND(p.minPrice || p.basePrice)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions bar inside product card */}
                            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleCompare(p)}
                                title={inCompare ? 'Bỏ khỏi so sánh' : 'Thêm vào so sánh'}
                                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                                  inCompare
                                    ? 'bg-blue-600 text-white font-bold'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                <span>⚖️</span>
                                <span>{inCompare ? 'Đã so sánh' : 'So sánh'}</span>
                              </button>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleAddRecommendedToCart(p)}
                                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 ${
                                    addedProductId === p.id
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                                  }`}
                                >
                                  {addedProductId === p.id ? '✓ Đã thêm' : '+ Giỏ hàng'}
                                </button>
                                <Link
                                  to={`/products/${p.slug}`}
                                  onClick={() => setIsOpen(false)}
                                  className="px-2.5 py-1 rounded-xl text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                  Xem
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Hiệu ứng đang gõ tin nhắn */}
            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl rounded-bl-xs w-32 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-slate-500 ml-1 font-medium">Đang phân tích...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Gợi ý câu hỏi nhanh */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            {prompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(p)}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/70 text-slate-700 text-[11px] whitespace-nowrap transition-colors font-medium"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Ô nhập tin nhắn */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200/80 shrink-0"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Hỏi cấu hình, so sánh, tầm giá..."
                className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                title="Gửi tin nhắn"
              >
                <svg className="w-4 h-4 -rotate-45 relative left-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>⚡ Gemini AI • MadK Hardware DB</span>
              <span>Enter để gửi</span>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default AiShoppingAssistantWidget;
