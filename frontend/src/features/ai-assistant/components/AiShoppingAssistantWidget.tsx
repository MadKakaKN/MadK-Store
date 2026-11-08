import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import aiAssistantApi, {
  AiChatMessage,
  AiRecommendedProduct,
} from '../../../api/aiAssistantApi';
import catalogApi from '../../../api/catalogApi';
import { useCart } from '../../cart/context/CartContext';
import { formatVND } from '../../../utils/format';

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendedProducts?: AiRecommendedProduct[];
  timestamp: string;
}

export const AiShoppingAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>(() => {
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Xin chào! Tôi là **MadK AI Tech Assistant** 🤖\n\nTôi có thể giúp bạn tư vấn cấu hình Laptop, PC Đồ họa/Gaming, chuột & bàn phím cơ, hoặc tìm thiết bị theo ngân sách. Bạn đang quan tâm đến sản phẩm nào?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([
    'Tư vấn laptop gaming dưới 25 triệu',
    'Chuột không dây gaming siêu nhẹ',
    'Cấu hình PC thiết kế đồ họa 3D',
    'Bàn phím cơ văn phòng êm ái',
  ]);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const { addToCart } = useCart();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cuộn xuống tin nhắn mới nhất
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
        // Sử dụng gợi ý mặc định nếu có lỗi
      });
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
          'Tôi đã tiếp nhận câu hỏi của bạn. Bạn vui lòng mô tả chi tiết hơn về nhu cầu (gaming, văn phòng, đồ họa) hoặc tầm giá mong muốn để tôi tư vấn chuẩn xác nhất nhé!',
        recommendedProducts: res.data?.recommendedProducts || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
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

  // Thêm nhanh sản phẩm gợi ý vào giỏ hàng
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

  // Làm sạch lịch sử chat
  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Đã xóa lịch sử hội thoại. Tôi có thể hỗ trợ tư vấn cấu hình hoặc giải đáp thắc mắc nào cho bạn?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Định dạng nội dung tin nhắn có Markdown cơ bản (*, **, xuống dòng)
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed text-sm">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-2" />;

          // Highlight bold text **text**
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <p key={idx} className="text-slate-200">
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={pIdx} className="font-bold text-cyan-300">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                if (part.startsWith('* ') || part.startsWith('- ')) {
                  return (
                    <span key={pIdx} className="inline-block pl-2 text-slate-300">
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
      {/* Nút bấm nổi kích hoạt Chatbot AI (Góc dưới bên phải) */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-[0_8px_30px_rgba(6,182,212,0.4)] hover:shadow-[0_10px_40px_rgba(6,182,212,0.6)] hover:scale-110 active:scale-95 transition-all duration-300"
            title="Trò chuyện với Trợ lý AI MadK"
          >
            {/* Vòng sáng pulse animation */}
            <span className="absolute -inset-1 rounded-full bg-cyan-400 opacity-40 animate-ping pointer-events-none" />

            {/* Sparkle Icon */}
            <svg
              className="w-7 h-7 relative z-10 transition-transform group-hover:rotate-12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>

            {/* Tooltip khi rê chuột */}
            <span className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-semibold whitespace-nowrap shadow-xl border border-slate-700/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Tư vấn công nghệ AI ✨
            </span>
          </button>
        )}
      </div>

      {/* Cửa sổ Chatbot AI (Popup) */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] h-[600px] max-h-[85vh] bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border-b border-cyan-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                {/* Trạng thái online */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-white">MadK AI Assistant</h3>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    GEMINI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Chuyên gia công nghệ & Gaming 24/7</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Nút xóa lịch sử */}
              <button
                type="button"
                onClick={handleClearChat}
                title="Làm mới cuộc trò chuyện"
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 flex items-center justify-center transition-colors"
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
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 flex items-center justify-center transition-colors text-base"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body tin nhắn */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs'
                      : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-xs'
                  }`}
                >
                  {renderFormattedText(msg.content)}
                  <span className="block text-[10px] text-slate-400 text-right mt-1.5 opacity-70">
                    {msg.timestamp}
                  </span>
                </div>

                {/* Thẻ sản phẩm gợi ý đính kèm */}
                {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                  <div className="mt-3 w-full space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                      <span>⚡</span> Sản phẩm gợi ý phù hợp:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.recommendedProducts.map((p) => (
                        <div
                          key={p.id}
                          className="bg-slate-900/90 border border-cyan-500/25 rounded-2xl p-2.5 flex items-center gap-3 hover:border-cyan-400/60 transition-colors"
                        >
                          <Link
                            to={`/products/${p.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="w-14 h-14 bg-slate-950 rounded-xl p-1 shrink-0 overflow-hidden flex items-center justify-center"
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
                            <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider block">
                              {p.brandName} • {p.categoryName}
                            </span>
                            <Link
                              to={`/products/${p.slug}`}
                              onClick={() => setIsOpen(false)}
                              className="font-bold text-xs text-white hover:text-cyan-300 truncate block transition-colors"
                              title={p.name}
                            >
                              {p.name}
                            </Link>
                            <span className="font-extrabold text-xs text-blue-400 block mt-0.5">
                              {formatVND(p.minPrice || p.basePrice)}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAddRecommendedToCart(p)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                addedProductId === p.id
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold active:scale-95'
                              }`}
                            >
                              {addedProductId === p.id ? '✓ Đã thêm' : '+ Giỏ'}
                            </button>
                            <Link
                              to={`/products/${p.slug}`}
                              onClick={() => setIsOpen(false)}
                              className="px-2 py-1 rounded-lg text-[10px] text-center text-slate-400 hover:text-white bg-slate-800 transition-colors"
                            >
                              Xem
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Hiệu ứng đang gõ tin nhắn */}
            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-xs w-28">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Gợi ý câu hỏi nhanh (Prompt chips) */}
          <div className="px-3 py-2 bg-slate-900/60 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            {prompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(p)}
                className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-cyan-950/60 hover:text-cyan-300 border border-slate-700/60 text-slate-300 text-[11px] whitespace-nowrap transition-colors"
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
            className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Hỏi về cấu hình, ngân sách, so sánh..."
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="w-10 h-10 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AiShoppingAssistantWidget;
