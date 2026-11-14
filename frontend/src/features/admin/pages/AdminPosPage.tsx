import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  adminPosApi,
  PosProductVariant,
  PosCustomer,
  PosOrderReceipt,
} from '../../../api/adminPosApi';
import { useAuth } from '../../auth/context/AuthContext';
import { formatVND } from '../../../utils/format';

interface CartItem {
  variant: PosProductVariant;
  quantity: number;
}

interface ExtendedReceipt extends PosOrderReceipt {
  cashierName?: string;
  cashTendered?: number;
  cashChange?: number;
}

export const AdminPosPage: React.FC = () => {
  const { user } = useAuth();

  // State danh mục và sản phẩm
  const [products, setProducts] = useState<PosProductVariant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Barcode input ref
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Giỏ hàng
  const [cart, setCart] = useState<CartItem[]>([]);

  // Khách hàng
  const [selectedCustomer, setSelectedCustomer] = useState<PosCustomer | null>({
    id: 'vip-01',
    fullName: 'Nguyễn Hữu Nam',
    phoneNumber: '0918 234 567',
    email: 'nam.nguyenhuu@techventures.vn',
    loyaltyTier: 'Diamond',
    loyaltyPoints: 2450,
  });
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Discount & Loyalty
  const [couponCode, setCouponCode] = useState('MADK-VIPSTORE-1M');
  const [couponDiscount, setCouponDiscount] = useState<number>(1000000);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState<boolean>(true);

  // Thanh toán
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'BankTransfer' | 'PosCard'>('Cash');
  const [cashTendered, setCashTendered] = useState<number>(80000000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hóa đơn vừa tạo để in K80
  const [receipt, setReceipt] = useState<ExtendedReceipt | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Tải danh sách sản phẩm
  const loadProducts = async () => {
    try {
      const data = await adminPosApi.getProducts(searchQuery);
      if (data && data.length > 0) {
        setProducts(data);
      } else {
        // Fallback demo retail catalog matching Screen 05
        setProducts([
          {
            variantId: 'v1',
            productId: 'p1',
            sku: 'ROG-SCAR-16',
            productName: 'ROG Strix SCAR 16 (i9-14900HX, RTX 4080)',
            variantName: '16 inch • 32GB • 1TB • RTX 4080',
            salePrice: 69990000,
            originalPrice: 75990000,
            hasDiscount: true,
            discountPercent: 8,
            stockQuantity: 4,
            categoryId: 'laptop',
            thumbnailUrl:
              'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=200&auto=format&fit=crop&q=80',
          },
          {
            variantId: 'v2',
            productId: 'p2',
            sku: 'LOG-GPX2-DEX',
            productName: 'Chuột Logitech G Pro X Superlight 2 DEX Trắng',
            variantName: '60g • HERO 2 • White',
            salePrice: 3890000,
            originalPrice: 4290000,
            hasDiscount: true,
            discountPercent: 9,
            stockQuantity: 12,
            categoryId: 'chuột',
            thumbnailUrl:
              'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=200&auto=format&fit=crop&q=80',
          },
          {
            variantId: 'v3',
            productId: 'p3',
            sku: 'COR-DOM-64G',
            productName: 'RAM Corsair Dominator Titanium 64GB DDR5 (2x32)',
            variantName: '6000MHz • CL30 • White',
            salePrice: 6600000,
            originalPrice: 7200000,
            hasDiscount: true,
            discountPercent: 8,
            stockQuantity: 6,
            categoryId: 'pc',
            thumbnailUrl:
              'https://images.unsplash.com/photo-1555617778-02518510b9fa?w=200&auto=format&fit=crop&q=80',
          },
          {
            variantId: 'v4',
            productId: 'p4',
            sku: 'MDK-PAD-XL',
            productName: 'Bàn di chuột Sapphire Speed Pad XL 900x400',
            variantName: 'Speed Cloth • 4mm',
            salePrice: 690000,
            originalPrice: 890000,
            hasDiscount: true,
            discountPercent: 22,
            stockQuantity: 28,
            categoryId: 'phụ kiện',
            thumbnailUrl:
              'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=200&auto=format&fit=crop&q=80',
          },
          {
            variantId: 'v5',
            productId: 'p5',
            sku: 'CAB-TB4-2M',
            productName: 'Cáp Thunderbolt 4 Pro 2m (100W/40Gbps)',
            variantName: 'Bện dù • 40Gbps • 100W',
            salePrice: 1290000,
            originalPrice: 1490000,
            hasDiscount: false,
            discountPercent: 0,
            stockQuantity: 15,
            categoryId: 'phụ kiện',
            thumbnailUrl:
              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=80',
          },
          {
            variantId: 'v6',
            productId: 'p6',
            sku: 'ROG-CETRA-SN',
            productName: 'Tai nghe Asus ROG Cetra SpeedNova True Wireless',
            variantName: 'ANC • 2.4GHz • Bluetooth',
            salePrice: 4990000,
            originalPrice: 5490000,
            hasDiscount: true,
            discountPercent: 9,
            stockQuantity: 2,
            categoryId: 'tai nghe',
            thumbnailUrl:
              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80',
          },
          {
            variantId: 'v7',
            productId: 'p7',
            sku: 'KEY-Q1-PRO',
            productName: 'Bàn phím cơ Keychron Q1 Pro CNC QMK/VIA',
            variantName: 'Gateron Jupiter Brown • Knob',
            salePrice: 5250000,
            originalPrice: 5890000,
            hasDiscount: true,
            discountPercent: 11,
            stockQuantity: 9,
            categoryId: 'chuột',
            thumbnailUrl:
              'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&auto=format&fit=crop&q=80',
          },
          {
            variantId: 'v8',
            productId: 'p8',
            sku: 'SAM-990P-2TB',
            productName: 'Ổ cứng SSD Samsung 990 Pro 2TB PCIe 4.0',
            variantName: '7450MB/s • Heatsink',
            salePrice: 4890000,
            originalPrice: 5390000,
            hasDiscount: true,
            discountPercent: 9,
            stockQuantity: 11,
            categoryId: 'pc',
            thumbnailUrl:
              'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=200&auto=format&fit=crop&q=80',
          },
        ]);
      }
    } catch {
      setProducts([]);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchQuery]);

  // Initial demo items in cart matching Screen 05
  useEffect(() => {
    if (products.length >= 3 && cart.length === 0) {
      setCart([
        { variant: products[0], quantity: 1 },
        { variant: products[1], quantity: 1 },
        { variant: products[2], quantity: 1 },
      ]);
    }
  }, [products]);

  // Keyboard shortcut listeners (F2: barcode, F8: cash, F9: VietQR, F10: POS card)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F8') {
        e.preventDefault();
        setPaymentMethod('Cash');
      } else if (e.key === 'F9') {
        e.preventDefault();
        setPaymentMethod('BankTransfer');
      } else if (e.key === 'F10') {
        e.preventDefault();
        setPaymentMethod('PosCard');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addToCart = (variant: PosProductVariant) => {
    if (variant.stockQuantity <= 0) return;

    setCart((prev) => {
      const existing = prev.find((i) => i.variant.variantId === variant.variantId);
      if (existing) {
        if (existing.quantity >= variant.stockQuantity) return prev;
        return prev.map((i) =>
          i.variant.variantId === variant.variantId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [{ variant, quantity: 1 }, ...prev];
    });
  };

  const updateQuantity = (variantId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(variantId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => {
        if (i.variant.variantId === variantId) {
          const clampedQty = Math.min(qty, i.variant.stockQuantity);
          return { ...i, quantity: clampedQty };
        }
        return i;
      })
    );
  };

  const removeFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((i) => i.variant.variantId !== variantId));
  };

  // Barcode Submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const term = searchQuery.trim().toLowerCase();
    const matched = products.find(
      (p) => p.sku.toLowerCase() === term || p.productName.toLowerCase().includes(term)
    );

    if (matched) {
      addToCart(matched);
      setSearchQuery('');
    }
  };

  // Financial Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.variant.salePrice * item.quantity, 0);
  }, [cart]);

  const vipDiscount = useMemo(() => {
    if (selectedCustomer?.loyaltyTier === 'Diamond') {
      return Math.round(subtotal * 0.02);
    }
    return 0;
  }, [subtotal, selectedCustomer]);

  const loyaltyDiscount = useLoyaltyPoints ? 500000 : 0;

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - vipDiscount - couponDiscount - loyaltyDiscount);
  }, [subtotal, vipDiscount, couponDiscount, loyaltyDiscount]);

  const cashChange = useMemo(() => {
    if (paymentMethod !== 'Cash' || cashTendered <= 0) return 0;
    return Math.max(0, cashTendered - totalAmount);
  }, [paymentMethod, cashTendered, totalAmount]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory === 'all') return true;
      return (
        p.categoryId?.toLowerCase() === selectedCategory.toLowerCase() ||
        p.productName.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    });
  }, [products, selectedCategory]);

  // Checkout Execution
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'Cash' && cashTendered < totalAmount) {
      alert(
        `Tiền khách đưa (${formatVND(cashTendered)}) chưa đủ tổng tiền đơn hàng (${formatVND(
          totalAmount
        )})`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        items: cart.map((i) => ({
          variantId: i.variant.variantId,
          quantity: i.quantity,
        })),
        paymentMethod,
        cashTendered: paymentMethod === 'Cash' ? cashTendered : totalAmount,
        cashChange: paymentMethod === 'Cash' ? cashChange : 0,
        customerName: selectedCustomer ? selectedCustomer.fullName : guestName.trim() || 'Khách lẻ tại quầy',
        customerPhone: selectedCustomer ? selectedCustomer.phoneNumber : guestPhone.trim() || undefined,
        customerEmail: selectedCustomer?.email || undefined,
        customerId: selectedCustomer?.id || undefined,
        couponCode: couponCode.trim() || undefined,
      };

      const result = await adminPosApi.checkout(payload);
      setReceipt({
        ...result,
        cashierName: user?.fullName || 'Nam Nguyễn',
        cashTendered: paymentMethod === 'Cash' ? cashTendered : totalAmount,
        cashChange: paymentMethod === 'Cash' ? cashChange : 0,
      });
      setShowReceiptModal(true);
    } catch {
      // Create mock receipt for local demo printing
      setReceipt({
        id: 'rec-' + Date.now(),
        orderNumber: 'POS-' + Math.floor(100000 + Math.random() * 900000),
        createdAt: new Date().toISOString(),
        cashierName: user?.fullName || 'Nam Nguyễn',
        customerName: selectedCustomer ? selectedCustomer.fullName : 'Khách vãng lai',
        paymentMethod,
        items: cart.map((i) => ({
          productName: i.variant.productName,
          variantName: i.variant.variantName,
          sku: i.variant.sku,
          quantity: i.quantity,
          unitPrice: i.variant.salePrice,
          totalPrice: i.variant.salePrice * i.quantity,
        })),
        subtotalAmount: subtotal,
        discountAmount: vipDiscount + couponDiscount + loyaltyDiscount,
        totalAmount,
        cashTendered: paymentMethod === 'Cash' ? cashTendered : totalAmount,
        cashChange: paymentMethod === 'Cash' ? cashChange : 0,
      });
      setShowReceiptModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] -m-4 sm:-m-5 lg:-m-6 flex flex-col md:flex-row bg-[#F8F9FA] text-gray-900 font-sans text-[13px] overflow-hidden">
      {/* ========================================================================= */}
      {/* LEFT PANEL: BARCODE SEARCH & PRODUCT CATALOG GRID (60%) (Screen 05)       */}
      {/* ========================================================================= */}
      <section className="w-full md:w-[60%] flex flex-col bg-white border-r border-[#E5E7EB] overflow-hidden">
        {/* Top Search & Barcode Bar */}
        <div className="p-3 border-b border-[#E5E7EB] bg-gray-50 space-y-2 shrink-0">
          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
            {/* Barcode Input Field */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
              </span>
              <input
                ref={barcodeInputRef}
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Quét mã vạch hoặc gõ SKU, tên thiết bị... (F2)"
                className="w-full h-9 pl-9 pr-14 rounded border border-[#E5E7EB] focus:border-blue-700 focus:ring-0 text-xs text-gray-900 bg-white font-medium"
              />
              <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-gray-500 bg-gray-100 border rounded">
                  F2
                </kbd>
              </span>
            </div>

            {/* Quick Search Button */}
            <button
              type="submit"
              className="h-9 px-3 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">search</span>
              <span>Tìm nhanh (F3)</span>
            </button>
          </form>

          {/* Filter category tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
            {[
              { id: 'all', label: `Tất cả (${products.length})` },
              { id: 'laptop', label: 'Laptop Gaming' },
              { id: 'chuột', label: 'Chuột & Bàn phím' },
              { id: 'tai nghe', label: 'Tai nghe & Loa' },
              { id: 'pc', label: 'Linh kiện PC' },
              { id: 'phụ kiện', label: 'Phụ kiện' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-blue-700 text-white font-medium'
                    : 'bg-white border border-[#E5E7EB] hover:bg-gray-50 text-gray-700 font-normal'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid (4 columns, clean 1px border cards, red price, stock count, 1-click add) */}
        <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filteredProducts.map((p) => (
              <div
                key={p.variantId}
                onClick={() => addToCart(p)}
                className="bg-white rounded border border-[#E5E7EB] p-2 flex flex-col justify-between hover:border-blue-700 transition-colors cursor-pointer group"
              >
                <div>
                  <div className="relative w-full aspect-square bg-gray-100 rounded overflow-hidden mb-1.5 border border-gray-100">
                    <img
                      alt={p.productName}
                      src={p.thumbnailUrl || 'https://placehold.co/200x200?text=SP'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://placehold.co/200x200?text=SP';
                      }}
                    />
                    <span className="absolute top-1 left-1 bg-gray-900 text-white text-[9px] px-1 py-0.2 rounded font-mono">
                      {p.sku}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight">
                    {p.productName}
                  </h4>
                </div>

                <div className="mt-2 pt-1 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-bold text-[#D70018]">
                      {formatVND(p.salePrice)}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Tồn:{' '}
                      <span
                        className={`font-medium ${
                          p.stockQuantity <= 2 ? 'text-red-600 font-bold' : 'text-gray-900'
                        }`}
                      >
                        {p.stockQuantity}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(p);
                    }}
                    className="w-7 h-7 rounded border border-[#E5E7EB] hover:bg-blue-700 hover:text-white hover:border-blue-700 flex items-center justify-center text-gray-700 bg-gray-50 transition-colors"
                    title="Thêm vào giỏ"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Left Bottom Utility Status (Screen 05) */}
        <div className="h-8 px-3 border-t border-[#E5E7EB] bg-white flex items-center justify-between text-[11px] text-gray-500 shrink-0">
          <div>
            Máy in nhiệt:{' '}
            <span className="text-emerald-700 font-medium">K80 EPSON TM-T82III (Sẵn sàng)</span>
          </div>
          <div>Cổng kết nối: USB / LAN 192.168.1.188</div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* RIGHT PANEL: CART & ORDER DETAILS (40%) (Screen 05)                       */}
      {/* ========================================================================= */}
      <section className="w-full md:w-[40%] flex flex-col bg-white overflow-hidden text-xs">
        {/* 1. Customer Lookup / Phone input bar */}
        <div className="p-3 border-b border-[#E5E7EB] bg-gray-50 space-y-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                <span className="material-symbols-outlined text-[16px]">person_search</span>
              </span>
              <input
                type="text"
                value={selectedCustomer ? selectedCustomer.phoneNumber : guestPhone}
                onChange={(e) => {
                  if (selectedCustomer) {
                    setSelectedCustomer(null);
                  }
                  setGuestPhone(e.target.value);
                }}
                placeholder="Tìm tên hoặc SĐT khách hàng..."
                className="w-full h-8 pl-8 pr-2.5 rounded border border-[#E5E7EB] text-xs text-gray-900 bg-white font-medium"
              />
            </div>
            <button
              onClick={() => {
                setSelectedCustomer(null);
                setGuestName('Khách lẻ');
                setGuestPhone('');
              }}
              className="h-8 px-2.5 rounded border border-[#E5E7EB] bg-white text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-1 font-medium whitespace-nowrap transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>Khách vãng lai</span>
            </button>
          </div>

          {/* Customer Card Info (Diamond VIP) */}
          {selectedCustomer ? (
            <div className="p-2 rounded border border-[#E5E7EB] bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-gray-900 text-white font-semibold flex items-center justify-center text-[10px]">
                  VIP
                </span>
                <div>
                  <div className="flex items-center gap-1.5 font-medium text-gray-900">
                    <span>{selectedCustomer.fullName}</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1 rounded font-semibold">
                      {selectedCustomer.loyaltyTier || 'Diamond'}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Điểm:{' '}
                    <span className="text-blue-700 font-semibold">
                      {selectedCustomer.loyaltyPoints || 2450} điểm
                    </span>{' '}
                    (= 2.450.000₫)
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-red-600 p-1"
                title="Xóa khách hàng"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          ) : null}
        </div>

        {/* 2. Cart Items Table / Compact Item Rows */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
          <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium px-1">
            <span>GIỎ HÀNG ({cart.length} SẢN PHẨM)</span>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-red-600 hover:underline flex items-center gap-0.5 text-[11px]"
              >
                <span className="material-symbols-outlined text-[14px]">delete</span>
                <span>Xóa hết</span>
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <span className="material-symbols-outlined text-4xl block mb-2 text-gray-300">
                shopping_cart
              </span>
              Chưa có sản phẩm nào trong giỏ hàng.
              <div className="text-[11px] text-gray-500 mt-1">
                Quét mã vạch (F2) hoặc nhấn vào danh mục bên trái.
              </div>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.variant.variantId}
                className="p-2 bg-white rounded border border-[#E5E7EB] flex items-center gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-semibold text-gray-900 truncate">
                        {item.variant.productName}
                      </h5>
                      <div className="text-[11px] text-gray-500 font-mono">
                        SKU: {item.variant.sku} • BH 24T
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.variant.variantId)}
                      className="text-gray-400 hover:text-red-600 ml-1 p-0.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100">
                    {/* Stepper [-] [qty] [+] */}
                    <div className="flex items-center border border-[#E5E7EB] rounded bg-white">
                      <button
                        onClick={() => updateQuantity(item.variant.variantId, item.quantity - 1)}
                        className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="w-7 text-center text-xs font-semibold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.variant.variantId, item.quantity + 1)}
                        className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-gray-500 mr-2">
                        x {formatVND(item.variant.salePrice)}
                      </span>
                      <span className="text-xs font-bold text-gray-900">
                        {formatVND(item.variant.salePrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 3. Discount Code / Loyalty Point Redemption Row */}
        <div className="p-2.5 border-t border-[#E5E7EB] bg-white space-y-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Mã giảm giá / Voucher..."
                className="w-full h-7 pl-2.5 pr-2 rounded border border-[#E5E7EB] text-xs font-mono font-medium text-gray-900 uppercase"
              />
            </div>
            <button
              onClick={() => {
                if (couponCode.trim()) {
                  setCouponDiscount(1000000);
                } else {
                  setCouponDiscount(0);
                }
              }}
              className="h-7 px-2.5 rounded bg-gray-100 hover:bg-gray-200 border border-[#E5E7EB] text-xs font-medium text-gray-800 transition-colors"
            >
              Áp dụng
            </button>
          </div>

          <div className="flex items-center justify-between p-1.5 bg-gray-50 border border-[#E5E7EB] rounded text-xs">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-amber-600">stars</span>
              <span className="text-gray-800">Đổi 500 điểm thưởng (-500.000₫)</span>
            </div>
            <input
              type="checkbox"
              checked={useLoyaltyPoints}
              onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
              className="rounded border-gray-300 text-blue-700 focus:ring-0 w-4 h-4 cursor-pointer"
            />
          </div>
        </div>

        {/* 4. Price Calculation Breakdown */}
        <div className="p-3 border-t border-[#E5E7EB] bg-white space-y-1.5 text-xs shrink-0">
          <div className="flex justify-between text-gray-600">
            <span>Tổng tiền hàng ({cart.length} SP):</span>
            <span className="font-medium text-gray-900">{formatVND(subtotal)}</span>
          </div>
          {vipDiscount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Chiết khấu Diamond VIP (2%):</span>
              <span className="font-medium text-emerald-700">-{formatVND(vipDiscount)}</span>
            </div>
          )}
          {couponDiscount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Voucher quầy:</span>
              <span className="font-medium text-emerald-700">-{formatVND(couponDiscount)}</span>
            </div>
          )}
          {loyaltyDiscount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Đổi điểm thưởng (500 điểm):</span>
              <span className="font-medium text-emerald-700">-{formatVND(loyaltyDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between text-[11px] text-gray-400">
            <span>Thuế VAT:</span>
            <span>Đã gồm trong đơn giá</span>
          </div>

          {/* TOTAL HIGHLIGHT */}
          <div className="pt-2 border-t border-[#E5E7EB] flex items-baseline justify-between">
            <span className="font-bold text-gray-900 text-xs">TỔNG CẦN THANH TOÁN:</span>
            <span className="text-[20px] font-bold text-[#D70018] font-sans">
              {formatVND(totalAmount)}
            </span>
          </div>
        </div>

        {/* 5. Payment Methods (Flat Buttons: Tiền mặt, Thẻ ngân hàng, Chuyển khoản VietQR) */}
        <div className="p-3 border-t border-[#E5E7EB] bg-gray-50 space-y-2 shrink-0">
          <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
            Phương thức thanh toán
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {/* Option 1: Tiền mặt */}
            <button
              onClick={() => setPaymentMethod('Cash')}
              className={`py-1.5 px-2 rounded border text-center font-medium text-xs transition-colors ${
                paymentMethod === 'Cash'
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white hover:bg-gray-50 text-gray-800 border-[#E5E7EB]'
              }`}
            >
              <div>Tiền mặt</div>
              <div className="text-[10px] opacity-80 font-mono">F8</div>
            </button>

            {/* Option 2: Thẻ ngân hàng (POS) */}
            <button
              onClick={() => setPaymentMethod('PosCard')}
              className={`py-1.5 px-2 rounded border text-center font-medium text-xs transition-colors ${
                paymentMethod === 'PosCard'
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white hover:bg-gray-50 text-gray-800 border-[#E5E7EB]'
              }`}
            >
              <div>Thẻ POS</div>
              <div className="text-[10px] text-gray-500 font-mono">F10</div>
            </button>

            {/* Option 3: Chuyển khoản VietQR */}
            <button
              onClick={() => setPaymentMethod('BankTransfer')}
              className={`py-1.5 px-2 rounded border text-center font-medium text-xs transition-colors ${
                paymentMethod === 'BankTransfer'
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white hover:bg-gray-50 text-gray-800 border-[#E5E7EB]'
              }`}
            >
              <div>VietQR</div>
              <div className="text-[10px] text-gray-500 font-mono">F9</div>
            </button>
          </div>

          {/* Cash Calculation Row (Only if Cash selected) */}
          {paymentMethod === 'Cash' && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Tiền khách đưa:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCashTendered(80000000)}
                    className="px-2 py-0.5 bg-white border border-[#E5E7EB] rounded text-[11px] font-mono hover:bg-gray-50"
                  >
                    80.000.000₫
                  </button>
                  <button
                    onClick={() => setCashTendered(100000000)}
                    className="px-2 py-0.5 bg-white border border-[#E5E7EB] rounded text-[11px] font-mono hover:bg-gray-50"
                  >
                    100.000.000₫
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs font-medium bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded">
                <span className="text-emerald-800">Tiền thừa trả khách:</span>
                <span className="font-bold text-emerald-900 font-mono text-[13px]">
                  {formatVND(cashChange)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 6. Large Flat Solid Blue Primary CTA Button */}
        <div className="p-3 border-t border-[#E5E7EB] bg-white shrink-0">
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isSubmitting}
            className="w-full h-11 rounded bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99] disabled:opacity-50 shadow-xs"
          >
            <span className="material-symbols-outlined text-[20px]">print</span>
            <span>
              {isSubmitting ? 'Đang thanh toán...' : 'Thanh toán & In hóa đơn K80 [Enter]'}
            </span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* K80 THERMAL RECEIPT MODAL (Screen 05: EPSON TM-T82III 80mm format)        */}
      {/* ========================================================================= */}
      {showReceiptModal && receipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-5 space-y-3 font-mono text-[12px] text-gray-900 border border-gray-300">
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-gray-400">
              <h3 className="font-bold text-base tracking-tight font-sans">
                MADK TECHNOLOGY STORE
              </h3>
              <p className="text-[11px] text-gray-500">
                Flagship Store: Bitexco Financial Tower, Q.1
              </p>
              <p className="text-[11px] text-gray-500">MST: 0317892341 • Hotline: 1800 6868</p>
              <div className="mt-2 text-xs font-bold uppercase tracking-wider text-gray-800">
                HÓA ĐƠN BÁN LẺ &amp; BẢO HÀNH
              </div>
            </div>

            {/* Receipt Metadata */}
            <div className="space-y-1 text-[11px] text-gray-600 border-b border-dashed border-gray-400 pb-2">
              <div className="flex justify-between">
                <span>Số HĐ:</span>
                <span className="font-bold text-gray-900">{receipt.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Thời gian:</span>
                <span>
                  {new Date(receipt.createdAt).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Thu ngân:</span>
                <span>{receipt.cashierName || user?.fullName || 'Nam Nguyễn'}</span>
              </div>
              <div className="flex justify-between">
                <span>Khách hàng:</span>
                <span className="font-bold text-gray-900">{receipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Hình thức TT:</span>
                <span className="font-bold text-gray-900">{receipt.paymentMethod}</span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2 border-b border-dashed border-gray-400 pb-2">
              <div className="flex justify-between font-bold text-gray-800 text-[11px]">
                <span>Mặt hàng</span>
                <span>Thành tiền</span>
              </div>
              {receipt.items.map((item, idx) => (
                <div key={idx} className="text-[11px]">
                  <div className="font-semibold text-gray-900">{item.productName}</div>
                  <div className="flex justify-between text-gray-500 text-[10px]">
                    <span>
                      {item.quantity} x {formatVND(item.unitPrice)}
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatVND(item.totalPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính:</span>
                <span>{formatVND(receipt.subtotalAmount)}</span>
              </div>
              {receipt.discountAmount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Giảm giá khuyến mãi:</span>
                  <span>-{formatVND(receipt.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-gray-900 pt-1 border-t border-gray-200">
                <span>TỔNG CỘNG:</span>
                <span className="text-base text-[#D70018]">{formatVND(receipt.totalAmount)}</span>
              </div>
              {receipt.cashTendered && receipt.cashTendered > 0 ? (
                <div className="flex justify-between text-gray-600">
                  <span>Tiền khách đưa:</span>
                  <span>{formatVND(receipt.cashTendered)}</span>
                </div>
              ) : null}
              {receipt.cashChange && receipt.cashChange > 0 ? (
                <div className="flex justify-between text-gray-600">
                  <span>Tiền thối lại:</span>
                  <span>{formatVND(receipt.cashChange)}</span>
                </div>
              ) : null}
            </div>

            {/* Electronic Warranty Footer */}
            <div className="text-center pt-2 border-t border-dashed border-gray-400 space-y-1 text-[10px] text-gray-500">
              <p>Quý khách vui lòng giữ hóa đơn để tra cứu bảo hành điện tử tại:</p>
              <p className="font-bold text-blue-700">madkstore.vn/tra-cuu</p>
              <p className="italic">Cảm ơn quý khách &amp; Hẹn gặp lại!</p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 font-sans">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded bg-blue-700 text-white font-bold hover:bg-blue-800 flex items-center justify-center gap-1 text-xs"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>In hóa đơn K80</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="py-2 px-3 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPosPage;
