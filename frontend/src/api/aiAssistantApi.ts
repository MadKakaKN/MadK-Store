import apiClient from './apiClient';
import { ApiEnvelope } from '../types/auth';
import { MOCK_PRODUCTS } from './mockData';

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiRecommendedProduct {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl?: string;
  basePrice: number;
  minPrice?: number;
  categoryName: string;
  brandName: string;
  reason: string;
}

export interface AiChatRequest {
  message: string;
  history?: AiChatMessage[];
  budget?: number;
  category?: string;
}

export interface AiChatResponse {
  reply: string;
  recommendedProducts: AiRecommendedProduct[];
}

// Bộ chuẩn hóa Telex và xóa dấu tiếng Việt trên Client
function normalizeVietnameseTelex(text: string): string {
  let res = text.toLowerCase();
  res = res.replace(/\b(ddieeneenj|ddieenj|ddieejn|dieenj|dienj|ddienj|ddeenj|ddieen|dieen)\b/g, 'điện');
  res = res.replace(/\b(thoaij|thooaij|thoaji|thoaị|thoai)\b/g, 'thoại');
  res = res.replace(/ddieeneenj\s*thoại?/g, 'điện thoại');
  res = res.replace(/ddieenj\s*thoaij?/g, 'điện thoại');
  res = res.replace(/dienj\s*thoaij?/g, 'điện thoại');
  res = res.replace(/dien\s*thoai/g, 'điện thoại');
  res = res.replace(/\bdienthoai\b/g, 'điện thoại');
  res = res.replace(/\b(đt|dt|ddt|dthoai|đthoại|dtdd)\b/g, 'điện thoại');
  res = res.replace(/\b(banf\s*phims?|phims\s*cow|ban\s*phim|phim\s*co)\b/g, 'bàn phím cơ');
  res = res.replace(/\b(chuoojt|chuootj|chuotj|chuot)\b/g, 'chuột');
  res = res.replace(/\b(manf\s*hinhf?|man\s*hinh)\b/g, 'màn hình');
  res = res.replace(/\b(tai\s*nghe|headphone|earphone|tai\s*phone)\b/g, 'tai nghe');
  res = res.replace(/\b(may\s*tinh\s*bang|maytinhbang)\b/g, 'máy tính bảng');
  return res;
}

function removeDiacritics(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/dd/g, 'd')
    .replace(/ee/g, 'e')
    .replace(/oo/g, 'o')
    .replace(/aa/g, 'a');
}

function generateClientFallbackRecommendation(request: AiChatRequest): AiChatResponse {
  const rawLower = (request.message || '').toLowerCase();
  const normMsg = normalizeVietnameseTelex(rawLower);
  const asciiMsg = removeDiacritics(normMsg);

  // Phân tích hội thoại tự nhiên (Chống lỗi regex Unicode word boundary và telex)
  const tokens = asciiMsg.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
  const greetingWords = ['chao', 'hello', 'hi', 'hey', 'alo', 'helo', 'halo'];
  const hasGreetingWord = tokens.some((t) => greetingWords.includes(t));
  const hasGreetingPhrase = [
    'xin chao', 'shop oi', 'ad oi', 'admin oi', 'bot oi', 'ban oi', 'em oi', 'anh oi',
    'he lo', 'co ai khong', 'co ai truc khong', 'co ai o day khong', 'good morning', 'good afternoon'
  ].some((p) => asciiMsg.includes(p));

  const isGreeting = hasGreetingWord || hasGreetingPhrase;

  const isThanks =
    /\b(cảm ơn|cam on|cám ơn|thanks|thank you|thx|tuyệt vời|tuyet voi|hay quá|hay qua|ok shop|oke shop|ok bạn|ok ban|ok em|oke em|oki|okie)\b/i.test(normMsg) ||
    /\b(cam on|thanks|thank you|thx|tuyet voi|hay qua|ok shop|oke shop|ok ban|ok em|oke em|oki|okie)\b/i.test(asciiMsg);

  const isBotInfo =
    normMsg.includes('bạn là ai') ||
    asciiMsg.includes('ban la ai') ||
    normMsg.includes('bạn có thể làm gì') ||
    asciiMsg.includes('ban co the lam gi') ||
    asciiMsg.includes('who are you');

  const isStoreInfo =
    normMsg.includes('shop ở đâu') ||
    asciiMsg.includes('shop o dau') ||
    normMsg.includes('cửa hàng ở đâu') ||
    asciiMsg.includes('cua hang o dau') ||
    normMsg.includes('địa chỉ') ||
    asciiMsg.includes('dia chi') ||
    normMsg.includes('hotline') ||
    normMsg.includes('số điện thoại') ||
    asciiMsg.includes('so dien thoai') ||
    asciiMsg.includes('sdt');

  const isWarranty =
    normMsg.includes('chính sách bảo hành') ||
    asciiMsg.includes('chinh sach bao hanh') ||
    normMsg.includes('bảo hành ra sao') ||
    asciiMsg.includes('bao hanh ra sao') ||
    normMsg.includes('đổi trả') ||
    asciiMsg.includes('doi tra') ||
    normMsg.includes('1 đổi 1') ||
    (normMsg.includes('bảo hành') && !normMsg.includes('mua') && !normMsg.includes('mẫu') && !normMsg.includes('laptop') && !normMsg.includes('điện thoại'));

  const isInstallment =
    normMsg.includes('trả góp') ||
    asciiMsg.includes('tra gop') ||
    normMsg.includes('có trả góp không') ||
    asciiMsg.includes('co tra gop khong') ||
    normMsg.includes('thanh toán') ||
    asciiMsg.includes('thanh toan');

  const isExplicitProductInquiry =
    normMsg.includes('bán chạy') ||
    asciiMsg.includes('ban chay') ||
    normMsg.includes('nổi bật') ||
    asciiMsg.includes('noi bat') ||
    normMsg.includes('sản phẩm hot') ||
    asciiMsg.includes('san pham hot');

  // Phân tích danh mục
  const isPhone =
    normMsg.includes('điện thoại') ||
    asciiMsg.includes('dien thoai') ||
    asciiMsg.includes('dienthoai') ||
    normMsg.includes('smartphone') ||
    asciiMsg.includes('smartphone') ||
    normMsg.includes('iphone') ||
    asciiMsg.includes('iphone') ||
    normMsg.includes('galaxy') ||
    asciiMsg.includes('galaxy') ||
    /\b(đt|dt|ddt|dthoai|đthoại|dtdd)\b/i.test(normMsg) ||
    /\b(dt|ddt|dthoai|dtdd)\b/i.test(asciiMsg);

  const isLaptop =
    normMsg.includes('laptop') ||
    asciiMsg.includes('laptop') ||
    normMsg.includes('máy tính xách tay') ||
    asciiMsg.includes('may tinh xach tay') ||
    normMsg.includes('macbook') ||
    asciiMsg.includes('macbook');

  const isKeyboard =
    normMsg.includes('bàn phím') ||
    asciiMsg.includes('ban phim') ||
    normMsg.includes('phím cơ') ||
    asciiMsg.includes('phim co') ||
    normMsg.includes('keyboard') ||
    asciiMsg.includes('keyboard') ||
    normMsg.includes('keychron');

  const isMouse =
    normMsg.includes('chuột') ||
    asciiMsg.includes('chuot') ||
    normMsg.includes('mouse') ||
    asciiMsg.includes('mouse');

  const isHeadset =
    normMsg.includes('tai nghe') ||
    asciiMsg.includes('tai nghe') ||
    normMsg.includes('headset') ||
    asciiMsg.includes('headphone');

  const isMonitor =
    normMsg.includes('màn hình') ||
    asciiMsg.includes('man hinh') ||
    normMsg.includes('monitor');

  const isAllRequest =
    normMsg.includes('tất cả') ||
    asciiMsg.includes('tat ca') ||
    normMsg.includes('toàn bộ') ||
    asciiMsg.includes('toan bo') ||
    normMsg.includes('các mẫu') ||
    asciiMsg.includes('cac mau') ||
    normMsg.includes('danh sách') ||
    asciiMsg.includes('danh sach') ||
    asciiMsg.includes('all');

  const isApple = normMsg.includes('apple') || asciiMsg.includes('apple') || normMsg.includes('iphone') || asciiMsg.includes('iphone');
  const isSamsung = normMsg.includes('samsung') || asciiMsg.includes('samsung') || normMsg.includes('galaxy') || asciiMsg.includes('galaxy');

  const hasSpecificCategory = isPhone || isLaptop || isKeyboard || isMouse || isHeadset || isMonitor;

  // XỬ LÝ HỘI THOẠI TỰ NHIÊN: Khi khách hàng chỉ chào hỏi hoặc hỏi chính sách chung
  if (!hasSpecificCategory && !isExplicitProductInquiry) {
    if (isGreeting) {
      return {
        reply: [
          'Dạ MadK Store xin chào bạn! 🤖 Rất vui được đón tiếp bạn hôm nay.',
          '',
          'Em là **MadK AI Tech Assistant** - chuyên viên tư vấn công nghệ tại cửa hàng. MadK Store hiện đang kinh doanh chính hãng các dòng sản phẩm:',
          '• 📱 **Điện thoại thông minh**: iPhone 15/14 Series VNA, Samsung Galaxy S24 Series, Z Fold5/Flip5',
          '• 💻 **Laptop & Máy tính xách tay**: Laptop Gaming (ASUS ROG, Acer Predator, Lenovo Legion), Laptop Doanh nhân, Đồ họa',
          '• ⌨️ **Gaming Gear & Phụ kiện**: Bàn phím cơ custom Keychron/Razer, Chuột gaming siêu nhẹ, Tai nghe chống ồn',
          '• 🖥️ **Màn hình & Linh kiện PC**: Màn hình 144Hz - 240Hz, CPU Intel/AMD, VGA RTX 40-Series, RAM, SSD',
          '',
          'Hôm nay bạn đang quan tâm đến dòng sản phẩm nào hoặc cần tư vấn cấu hình trong tầm giá bao nhiêu để em hỗ trợ bạn chi tiết nhé?',
        ].join('\n'),
        recommendedProducts: [],
      };
    }

    if (isThanks) {
      return {
        reply:
          'Dạ không có gì ạ! Rất vui vì đã hỗ trợ được cho bạn. 😊\n\nNếu bạn cần xem chi tiết cấu hình, so sánh giữa các mẫu máy hoặc hướng dẫn đặt hàng để nhận quà tặng và ưu đãi tại MadK Store, bạn cứ nhắn cho em bất kỳ lúc nào nhé!',
        recommendedProducts: [],
      };
    }

    if (isBotInfo) {
      return {
        reply: [
          'Em là **MadK AI Tech Assistant** 🤖 - Trợ lý trí tuệ nhân tạo chuyên sâu về phần cứng và thiết bị công nghệ tại hệ thống bán lẻ MadK Store.',
          '',
          'Em có thể giúp bạn:',
          '1. 🔍 **Tra cứu & Tìm kiếm sản phẩm**: Điện thoại, laptop, linh kiện PC và phụ kiện chính hãng.',
          '2. ⚖️ **So sánh thông số phần cứng**: Phân tích CPU, GPU, màn hình, switch phím... giúp bạn chọn thiết bị tối ưu nhất.',
          '3. 💰 **Tối ưu theo ngân sách**: Gợi ý các cấu hình có hiệu năng/giá thành (P/P) tốt nhất theo mức tiền bạn dự chi.',
          '4. 🛡️ **Tư vấn chính sách**: Bảo hành 1 đổi 1 trong 30 ngày, trả góp 0%, tích điểm thành viên MadK Rewards.',
          '',
          'Hôm nay bạn cần em hỗ trợ tìm kiếm hay so sánh thiết bị nào ạ?',
        ].join('\n'),
        recommendedProducts: [],
      };
    }

    if (isStoreInfo) {
      return {
        reply: [
          '🏢 **Thông tin liên hệ & Hệ thống MadK Store:**',
          '',
          '• **Địa chỉ showroom**: 123 Đường Công Nghệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
          '• **Hotline hỗ trợ & đặt hàng**: 0901.316.434 (8:00 - 21:30 hàng ngày)',
          '• **Thời gian mở cửa**: 8:00 - 21:30 (tất cả các ngày trong tuần, kể cả Thứ 7 & Chủ Nhật)',
          '• **Giao hàng toàn quốc**: Hỏa tốc 2h nội thành và giao nhanh toàn quốc qua đối tác Giao Hàng Nhanh (GHN).',
          '',
          'Bạn có thể ghé trực tiếp showroom để trải nghiệm sản phẩm thực tế hoặc đặt hàng trực tuyến trên website nhé!',
        ].join('\n'),
        recommendedProducts: [],
      };
    }

    if (isWarranty) {
      return {
        reply: [
          '🛡️ **Chính sách bảo hành & Đổi trả an tâm tại MadK Store:**',
          '',
          '• **Bảo hành chính hãng**: 12 đến 24 tháng theo tiêu chuẩn nhà sản xuất (Apple VNA, Samsung VN, ASUS, Keychron, Razer...).',
          '• **Chính sách 1 đổi 1**: Đổi mới 100% trong 30 ngày đầu tiên nếu máy phát sinh lỗi phần cứng từ nhà sản xuất.',
          '• **Hỗ trợ kỹ thuật trọn đời**: Vệ sinh máy, tra keo tản nhiệt miễn phí và hỗ trợ phần mềm trọn đời.',
          '• **Bảo hành điện tử**: Tra cứu tình trạng bảo hành và lịch sử bảo dưỡng trực tiếp qua số điện thoại trên hệ thống.',
          '',
          'Bạn cần kiểm tra bảo hành cho sản phẩm nào hay cần hỗ trợ thông tin gì thêm không ạ?',
        ].join('\n'),
        recommendedProducts: [],
      };
    }

    if (isInstallment) {
      return {
        reply: [
          '💳 **Chính sách Trả góp & Thanh toán linh hoạt tại MadK Store:**',
          '',
          '• **Trả góp 0% lãi suất**: Hỗ trợ qua thẻ tín dụng của hơn 25 ngân hàng hoặc qua công ty tài chính với thủ tục duyệt hồ sơ online trong 15 phút.',
          '• **Phương thức thanh toán đa dạng**:',
          '  - Quét mã VNPAY-QR, Ví MoMo nhận thêm mã giảm giá độc quyền.',
          '  - Chuyển khoản ngân hàng tự động xác nhận qua VietQR.',
          '  - Thanh toán tiền mặt khi nhận hàng (COD) toàn quốc.',
          '  - Quẹt thẻ POS trực tiếp tại cửa hàng (Visa, Mastercard, Napas).',
          '',
          'Bạn đang quan tâm hình thức trả góp cho dòng sản phẩm nào để em hướng dẫn chi tiết hồ sơ ạ?',
        ].join('\n'),
        recommendedProducts: [],
      };
    }

    if (rawLower.length < 10) {
      return {
        reply:
          'Dạ MadK Store có thể giúp gì cho bạn hôm nay ạ? Bạn đang quan tâm đến Điện thoại, Laptop, Linh kiện PC hay Gaming Gear để em tư vấn chi tiết cho bạn nhé!',
        recommendedProducts: [],
      };
    }
  }

  let candidates = [...MOCK_PRODUCTS];

  if (isPhone) {
    candidates = candidates.filter((p) =>
      p.category?.slug?.includes('dien-thoai') ||
      p.category?.name?.includes('Điện thoại') ||
      p.name.toLowerCase().includes('iphone') ||
      p.name.toLowerCase().includes('galaxy')
    );

    if (isApple && !isSamsung) {
      const appleFiltered = candidates.filter((p) => p.brand?.slug === 'apple' || p.name.includes('iPhone'));
      if (appleFiltered.length > 0) candidates = appleFiltered;
    } else if (isSamsung && !isApple) {
      const samsungFiltered = candidates.filter((p) => p.brand?.slug === 'samsung' || p.name.includes('Galaxy'));
      if (samsungFiltered.length > 0) candidates = samsungFiltered;
    }
  } else if (isLaptop) {
    candidates = candidates.filter((p) =>
      p.category?.slug?.includes('laptop') ||
      p.category?.name?.includes('Laptop') ||
      p.name.toLowerCase().includes('laptop') ||
      p.name.toLowerCase().includes('macbook')
    );
  } else if (isKeyboard) {
    candidates = candidates.filter((p) =>
      p.category?.slug?.includes('ban-phim') ||
      p.category?.name?.includes('Bàn phím') ||
      p.name.toLowerCase().includes('bàn phím') ||
      p.name.toLowerCase().includes('keychron')
    );
  } else if (isMouse) {
    candidates = candidates.filter((p) =>
      p.category?.slug?.includes('chuot') ||
      p.category?.name?.includes('Chuột') ||
      p.name.toLowerCase().includes('chuột') ||
      p.name.toLowerCase().includes('mouse')
    );
  } else if (isHeadset) {
    candidates = candidates.filter((p) =>
      p.category?.slug?.includes('tai-nghe') ||
      p.category?.name?.includes('Tai nghe') ||
      p.name.toLowerCase().includes('tai nghe')
    );
  } else if (isMonitor) {
    candidates = candidates.filter((p) =>
      p.category?.slug?.includes('man-hinh') ||
      p.category?.name?.includes('Màn hình') ||
      p.name.toLowerCase().includes('màn hình')
    );
  }

  const takeCount = isAllRequest ? 10 : 4;
  const matched = (candidates.length > 0 ? candidates : MOCK_PRODUCTS.filter((p) => p.isFeatured)).slice(0, takeCount);

  const replyLines: string[] = [];

  if (isGreeting) {
    replyLines.push('Dạ MadK Store xin chào bạn! Rất vui được hỗ trợ bạn.');
  }

  if (isPhone) {
    if (isAllRequest) {
      replyLines.push('MadK Store hiện đang phân phối đầy đủ các dòng **Điện thoại thông minh (Smartphones)** chính hãng mới nhất từ hai thương hiệu hàng đầu thế giới là **Apple** và **Samsung**:');
      replyLines.push('');
      replyLines.push('📱 **Hệ sinh thái Apple iPhone Chính Hãng (VNA):**');
      replyLines.push('• **iPhone 15 Pro Max & iPhone 15 Pro**: Khung viền Titan siêu nhẹ, chip Apple A17 Pro mạnh mẽ hàng đầu, camera tiềm vọng 5x chuyên nghiệp.');
      replyLines.push('• **iPhone 15 & iPhone 14**: Màn hình Dynamic Island hiện đại, camera chính 48MP sắc nét và thời lượng pin bền bỉ.');
      replyLines.push('');
      replyLines.push('⚡ **Hệ sinh thái Samsung Galaxy Flagship & Màn Hình Gập:**');
      replyLines.push('• **Galaxy S24 Ultra / S24 Plus / S24**: Quyền năng Galaxy AI tiên phong, camera 200MP zoom 100x, khung Titan và bút S-Pen.');
      replyLines.push('• **Galaxy Z Fold5 & Z Flip5**: Thiết kế màn hình gập thời thượng, bản lề Flex không kẽ hở, đa nhiệm đỉnh cao.');
      replyLines.push('• **Galaxy A55 5G**: Phân khúc cận cao cấp thiết kế khung kim loại sang trọng, pin 5000mAh.');
    } else {
      replyLines.push('Dưới đây là các mẫu **Điện thoại thông minh (Smartphones)** chính hãng nổi bật nhất tại MadK Store phù hợp với nhu cầu của bạn:');
    }
  } else if (isLaptop) {
    replyLines.push('💻 MadK Store xin gửi tới bạn danh sách các mẫu **Laptop chính hãng** đang được tin dùng nhất hiện nay:');
  } else if (isKeyboard) {
    replyLines.push('⌨️ Dưới đây là các mẫu **Bàn phím cơ cao cấp** mang lại cảm giác gõ êm ái và độ nảy xuất sắc:');
  } else if (isMouse) {
    replyLines.push('🖱️ Dưới đây là các mẫu **Chuột gaming không dây siêu nhẹ** với cảm biến quang học chính xác từng pixel:');
  } else {
    replyLines.push('✨ Dưới đây là những thiết bị công nghệ nổi bật được yêu thích nhất tại MadK Store:');
  }

  replyLines.push('');
  if (isPhone) replyLines.push('📋 **Danh sách các mẫu điện thoại đang có sẵn tại MadK Store:**');
  else if (isLaptop) replyLines.push('📋 **Danh sách các mẫu Laptop có sẵn tại MadK Store:**');
  else if (isKeyboard) replyLines.push('📋 **Danh sách bàn phím cơ chất lượng cao:**');
  else replyLines.push('📋 **Danh sách thiết bị đề xuất phù hợp nhất:**');

  const recommendedProducts: AiRecommendedProduct[] = matched.map((p) => {
    const minPrice = p.variants && p.variants.length > 0
      ? Math.min(...p.variants.map((v) => v.salePrice || v.originalPrice))
      : p.basePrice;

    replyLines.push(`• **${p.name}** (${p.brand?.name || 'Chính hãng'}): Giá niêm yết **${minPrice.toLocaleString('vi-VN')}đ**`);
    if (p.shortDescription) {
      replyLines.push(`  ↳ *${p.shortDescription}*`);
    }

    const reason = isPhone
      ? 'Điện thoại chính hãng VNA, camera sắc nét, bảo hành 12 tháng 1 đổi 1 trong 30 ngày.'
      : isKeyboard
      ? 'Switch cơ học gõ êm, kết nối đa thiết bị, độ bền cao.'
      : 'Hiệu năng cân bằng xuất sắc, độ bền cao, bảo hành chính hãng.';

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      thumbnailUrl: p.thumbnailUrl,
      basePrice: p.basePrice,
      minPrice,
      categoryName: p.category?.name || (isPhone ? 'Điện thoại thông minh' : 'Thiết bị'),
      brandName: p.brand?.name || 'Chính hãng',
      reason,
    };
  });

  replyLines.push('');
  replyLines.push('💡 **Chính sách ưu đãi độc quyền tại MadK Store:**');
  if (isPhone) {
    replyLines.push('- 🛡️ Máy mới 100% nguyên seal chính hãng (VNA/Samsung VN), bảo hành 12 - 24 tháng.');
    replyLines.push('- 🔄 Thu cũ đổi mới trợ giá đến 2.000.000đ, trả góp 0% lãi suất xét duyệt nhanh.');
    replyLines.push('- 💎 Tích lũy điểm thưởng **MadK Rewards** đến 5% giá trị đơn hàng.');
    replyLines.push('- 🚚 Giao hàng hỏa tốc toàn quốc qua Giao Hàng Nhanh (GHN).');
    replyLines.push('');
    replyLines.push('Bạn muốn xem chi tiết thông số hoặc cần tôi so sánh giữa các mẫu điện thoại nào ở trên không?');
  } else {
    replyLines.push('- 🛡️ Bảo hành chính hãng 12 - 24 tháng, lỗi 1 đổi 1 trong 30 ngày đầu.');
    replyLines.push('- 💎 Tích lũy điểm thưởng **MadK Rewards** đến 5% giá trị đơn hàng.');
    replyLines.push('- 🚚 Giao hàng hỏa tốc toàn quốc qua Giao Hàng Nhanh (GHN).');
    replyLines.push('');
    replyLines.push('Bạn có muốn xem chi tiết thông số hoặc cần tôi tư vấn so sánh giữa các mẫu trên không?');
  }

  return {
    reply: replyLines.join('\n'),
    recommendedProducts,
  };
}

export const aiAssistantApi = {
  chat: async (request: AiChatRequest): Promise<ApiEnvelope<AiChatResponse>> => {
    try {
      const res = await apiClient.post<ApiEnvelope<AiChatResponse>>('/ai/chat', request);
      if (res.data && res.data.data && res.data.data.reply) {
        return res.data;
      }
      throw new Error('Empty response from AI server');
    } catch {
      // Khi server backend đang khởi động lạnh hoặc không có kết nối mạng, chạy engine dự phòng cục bộ
      const fallbackData = generateClientFallbackRecommendation(request);
      return {
        data: fallbackData,
        message: 'Khuyến nghị sản phẩm chuẩn xác từ MadK Store Catalog',
      } as ApiEnvelope<AiChatResponse>;
    }
  },

  getPrompts: async (): Promise<ApiEnvelope<string[]>> => {
    try {
      const res = await apiClient.get<ApiEnvelope<string[]>>('/ai/prompts');
      if (res.data && res.data.data && res.data.data.length > 0) {
        return res.data;
      }
      throw new Error('Empty prompts');
    } catch {
      return {
        data: [
          'Tất cả mẫu điện thoại iPhone & Samsung',
          'Tư vấn laptop gaming dưới 25 triệu',
          'Bàn phím cơ văn phòng gõ êm',
          'Chuột không dây gaming siêu nhẹ',
        ],
        message: 'Default prompts',
      } as ApiEnvelope<string[]>;
    }
  },
};

export default aiAssistantApi;
