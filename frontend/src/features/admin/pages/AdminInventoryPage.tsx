import React, { useState, useEffect, useMemo } from 'react';
import {
  LowStockAlertDto,
  StockMovementDto,
  VariantInventoryItemDto,
} from '../../../types/inventory';
import { adminInventoryApi } from '../../../api/adminInventoryApi';
import { StockAdjustmentModal } from '../inventory/StockAdjustmentModal';
import { CreatePurchaseOrderModal } from '../inventory/CreatePurchaseOrderModal';
import { InventoryAuditModal } from '../inventory/InventoryAuditModal';
import { useToast } from '../components/common/ToastContext';

interface ExtendedVariantItem extends VariantInventoryItemDto {
  barcode?: string;
  lowStockThreshold?: number;
  shelfLocation?: string;
}

interface DisplayMovementItem {
  id: string;
  time: string;
  reference: string;
  type: string;
  staff: string;
  warehouse: string;
  sku: string;
  quantityChange: number;
  afterStock: string;
  note: string;
}

export const AdminInventoryPage: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [variants, setVariants] = useState<VariantInventoryItemDto[]>([]);
  const [movements, setMovements] = useState<StockMovementDto[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlertDto[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('tanbinh');
  const [quickFilter, setQuickFilter] = useState<string>('hot');

  // Modals state
  const [selectedVariantForAdjust, setSelectedVariantForAdjust] =
    useState<VariantInventoryItemDto | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, mRes, alertRes] = await Promise.all([
        adminInventoryApi.getVariantInventories(),
        adminInventoryApi.getMovements(),
        adminInventoryApi.getLowStockAlerts(),
      ]);

      if (vRes.isSuccess && vRes.data) setVariants(vRes.data);
      if (mRes.isSuccess && mRes.data) setMovements(mRes.data);
      if (alertRes.isSuccess && alertRes.data) setAlerts(alertRes.data);
    } catch {
      toast.error('Không thể tải dữ liệu tồn kho.', 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatVND = (amount: number) => {
    return amount.toLocaleString('vi-VN') + '₫';
  };

  // Demo fallback inventory items if backend table is empty
  const displayVariants = useMemo<ExtendedVariantItem[]>(() => {
    if (variants.length > 0) return variants;
    return [
      {
        variantId: 'v1',
        productId: 'p1',
        sku: 'ROG-ZEPH-G16',
        barcode: '893849102481',
        productName: 'ASUS ROG Zephyrus G16 (2025)',
        variantName: 'Core Ultra 9 • RTX 4080 • 32GB • 2TB',
        categoryName: 'Laptop Gaming',
        costPrice: 58200000,
        salePrice: 69990000,
        onHandQuantity: 3,
        reservedQuantity: 1,
        availableQuantity: 2,
        lowStockThreshold: 5,
        shelfLocation: 'A1-R02',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=100&auto=format&fit=crop&q=80',
      },
      {
        variantId: 'v2',
        productId: 'p2',
        sku: 'VGA-RTX4090-ST',
        barcode: '893849109923',
        productName: 'ROG Strix GeForce RTX 4090 OC',
        variantName: '24GB GDDR6X • Axial-tech Fan',
        categoryName: 'Linh kiện PC',
        costPrice: 48500000,
        salePrice: 56990000,
        onHandQuantity: 5,
        reservedQuantity: 2,
        availableQuantity: 3,
        lowStockThreshold: 6,
        shelfLocation: 'B2-R04',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=100&auto=format&fit=crop&q=80',
      },
      {
        variantId: 'v3',
        productId: 'p3',
        sku: 'MON-PG32UCDM',
        barcode: '893849103312',
        productName: 'ROG Swift OLED PG32UCDM 4K',
        variantName: '32 Inch • QD-OLED • 240Hz • 0.03ms',
        categoryName: 'Màn hình',
        costPrice: 29900000,
        salePrice: 36990000,
        onHandQuantity: 18,
        reservedQuantity: 4,
        availableQuantity: 14,
        lowStockThreshold: 5,
        shelfLocation: 'C3-A01',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=100&auto=format&fit=crop&q=80',
      },
      {
        variantId: 'v4',
        productId: 'p4',
        sku: 'KB-ROG-AZOTH',
        barcode: '893849104192',
        productName: 'ROG Azoth Extreme Wireless',
        variantName: 'OLED Touchscreen • Carbon Fiber • 8K',
        categoryName: 'Bàn phím & Chuột',
        costPrice: 9200000,
        salePrice: 11990000,
        onHandQuantity: 24,
        reservedQuantity: 6,
        availableQuantity: 18,
        lowStockThreshold: 8,
        shelfLocation: 'D1-R05',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=100&auto=format&fit=crop&q=80',
      },
      {
        variantId: 'v5',
        productId: 'p5',
        sku: 'CPU-AMD-9950X',
        barcode: '893849108174',
        productName: 'AMD Ryzen 9 9950X 16-Core',
        variantName: 'Socket AM5 • Up to 5.7GHz • 80MB Cache',
        categoryName: 'Linh kiện PC',
        costPrice: 16100000,
        salePrice: 18990000,
        onHandQuantity: 2,
        reservedQuantity: 2,
        availableQuantity: 0,
        lowStockThreshold: 10,
        shelfLocation: 'B1-S09',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1555617778-02518510b9fa?w=100&auto=format&fit=crop&q=80',
      },
      {
        variantId: 'v6',
        productId: 'p6',
        sku: 'MS-LOGI-GPX2',
        barcode: '893849105521',
        productName: 'Logitech G PRO X Superlight 2',
        variantName: 'HERO 2 • 60g Ultralight • White',
        categoryName: 'Bàn phím & Chuột',
        costPrice: 28500000,
        salePrice: 3890000,
        onHandQuantity: 45,
        reservedQuantity: 7,
        availableQuantity: 38,
        lowStockThreshold: 15,
        shelfLocation: 'D2-R01',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=100&auto=format&fit=crop&q=80',
      },
    ];
  }, [variants]);

  // Demo fallback movements
  const displayMovements = useMemo<DisplayMovementItem[]>(() => {
    if (movements.length > 0) {
      return movements.map((m) => ({
        id: m.id,
        time: new Date(m.createdAt).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        reference: m.referenceId || `#MOV-${m.id.slice(0, 6)}`,
        type: m.reason || 'Biến động kho',
        staff: 'Nhân viên kho',
        warehouse: 'Kho Tân Bình',
        sku: m.variantId || 'MDK-SKU',
        quantityChange: m.quantity,
        afterStock: `${m.onHandAfter} On-Hand`,
        note: m.reason || 'Giao dịch hệ thống',
      }));
    }
    return [
      {
        id: '1',
        time: 'Hôm nay, 14:32:08',
        reference: '#TX-OUT-892419',
        type: 'Xuất bán online #MK-892419',
        staff: 'Nguyễn Hoàng Vũ',
        warehouse: 'Kho Tân Bình',
        sku: 'ROG-ZEPH-G16',
        quantityChange: -1,
        afterStock: '3 On-Hand (2 Avail)',
        note: 'Khách nhận tại nhà qua GHN hỏa tốc. Đã quét IMEI seri 8491-0021',
      },
      {
        id: '2',
        time: 'Hôm nay, 11:15:40',
        reference: '#PO-2025-084',
        type: 'Nhập PO từ ASUS VN',
        staff: 'Trần Minh Quân',
        warehouse: 'Quản lý nhập hàng',
        sku: 'MON-PG32UCDM',
        quantityChange: 10,
        afterStock: '18 On-Hand (14 Avail)',
        note: 'Lô hàng nhập khẩu chính hãng FPT Synnex, hóa đơn GTGT #849021',
      },
      {
        id: '3',
        time: 'Hôm nay, 10:04:12',
        reference: '#POS-Q1-0941',
        type: 'Xuất bán tại quầy POS Q.1',
        staff: 'Lê Thuỳ Trang',
        warehouse: 'Thu ngân Bitexco',
        sku: 'MS-LOGI-GPX2',
        quantityChange: -2,
        afterStock: '45 On-Hand (38 Avail)',
        note: 'Thanh toán chuyển khoản VietQR Napas247, kèm quà tặng lót chuột',
      },
      {
        id: '4',
        time: 'Hôm qua, 17:45:00',
        reference: '#ADJ-AUDIT-2025',
        type: 'Điều chỉnh kiểm kê định kỳ',
        staff: 'Lâm Thế Dũng',
        warehouse: 'Kiểm toán nội bộ',
        sku: 'VGA-RTX4090-ST',
        quantityChange: -1,
        afterStock: '5 On-Hand (3 Avail)',
        note: 'Chuyển sang kho kỹ thuật làm mẫu trưng bày Live Showcase Bitexco',
      },
      {
        id: '5',
        time: 'Hôm qua, 15:10:22',
        reference: '#TX-OUT-891902',
        type: 'Xuất bán đơn #MK-891902',
        staff: 'Nguyễn Hoàng Vũ',
        warehouse: 'Kho Tân Bình',
        sku: 'KB-ROG-AZOTH',
        quantityChange: -3,
        afterStock: '24 On-Hand (18 Avail)',
        note: 'Giao hàng tiêu chuẩn GHN, đã xuất hóa đơn điện tử',
      },
    ];
  }, [movements]);

  const filteredVariants = displayVariants.filter((v) => {
    const threshold = v.lowStockThreshold || 5;
    if (
      searchQuery &&
      !v.sku.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !v.productName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (categoryFilter !== 'all' && !v.categoryName?.toLowerCase().includes(categoryFilter)) {
      return false;
    }
    if (stockStatusFilter === 'low' && v.availableQuantity >= threshold) return false;
    if (stockStatusFilter === 'out' && v.availableQuantity > 0) return false;
    if (stockStatusFilter === 'safe' && v.availableQuantity < threshold) return false;
    return true;
  });

  return (
    <div className="space-y-4 max-w-[1440px] w-full mx-auto text-[13px]">
      {/* ===================================================================== */}
      {/* PAGE TITLE & DIRECT BUTTONS (Screen 12)                              */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-gray-400 text-[11px] mb-0.5">
            <span>Hệ thống</span>
            <span>/</span>
            <span>Kho Vận</span>
            <span>/</span>
            <span className="text-gray-700 font-medium">Tồn Kho Thực Tế</span>
          </div>
          <h2 className="text-[20px] text-gray-900 tracking-tight flex items-center gap-2 font-semibold">
            Quản Lý Kho Hàng &amp; Tồn Kho Thực Tế
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Real-time
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              const csvContent =
                'data:text/csv;charset=utf-8,SKU,TenSanPham,GiaNhap,GiaNiemYet,TonKho,KhaDung\nROG-ZEPH-G16,Zephyrus G16,58200000,69990000,3,2\n';
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', 'TonKho_MadK_Realtime.csv');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              toast.success('Đã tải xuống báo cáo tồn kho Excel!', 'Xuất file');
            }}
            className="h-8 px-3 rounded bg-white border border-[#D1D5DB] text-gray-700 text-[12px] font-medium hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-emerald-700">
              file_download
            </span>
            <span>Xuất báo cáo tồn kho (Excel)</span>
          </button>

          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="h-8 px-3 rounded bg-white border border-[#D1D5DB] text-gray-700 text-[12px] font-medium hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-700">sync_alt</span>
            <span>Điều chỉnh / Kiểm kê kho</span>
          </button>

          <button
            onClick={() => setIsPoModalOpen(true)}
            className="h-8 px-3.5 rounded bg-blue-700 hover:bg-blue-800 text-white text-[12px] font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>+ Nhập hàng mới (PO)</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SUMMARY CARDS: 4 Flat white boxes (Screen 12: 1px border #E5E7EB)     */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total inventory value */}
        <div className="p-3.5 bg-white border border-[#E5E7EB] rounded">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[12px] font-medium">Tổng giá trị tồn kho</span>
            <span className="material-symbols-outlined text-[18px] text-gray-400">payments</span>
          </div>
          <div className="text-[22px] font-bold text-gray-900 tracking-tight font-mono">
            42.850.000.000₫
          </div>
          <div className="mt-1 text-[11px] text-gray-500 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">+3.8%</span>
            <span>so với tháng trước</span>
          </div>
        </div>

        {/* Card 2: Total SKUs */}
        <div className="p-3.5 bg-white border border-[#E5E7EB] rounded">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[12px] font-medium">Tổng số SKU đang quản lý</span>
            <span className="material-symbols-outlined text-[18px] text-gray-400">qr_code_2</span>
          </div>
          <div className="text-[22px] font-bold text-gray-900 tracking-tight font-mono">
            {variants.length || 348}{' '}
            <span className="text-[13px] font-normal text-gray-500 font-sans">SKU</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            <span>5 phân nhánh hàng • 3 kho vật lý</span>
          </div>
        </div>

        {/* Card 3: Reserved stock */}
        <div className="p-3.5 bg-white border border-[#E5E7EB] rounded">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[12px] font-medium">Hàng đang giữ (Reserved)</span>
            <span className="material-symbols-outlined text-[18px] text-gray-400">lock_clock</span>
          </div>
          <div className="text-[22px] font-bold text-gray-900 tracking-tight font-mono">
            126 <span className="text-[13px] font-normal text-gray-500 font-sans">sản phẩm</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            <span>42 đơn chờ xuất kho &amp; bàn giao</span>
          </div>
        </div>

        {/* Card 4: Low stock warning */}
        <div className="p-3.5 bg-white border border-[#E5E7EB] rounded">
          <div className="flex items-center justify-between text-[#D70018] mb-1">
            <span className="text-[12px] font-semibold">Cảnh báo thiếu hàng</span>
            <span className="material-symbols-outlined text-[18px] text-[#D70018]">warning</span>
          </div>
          <div className="text-[22px] font-bold text-[#D70018] tracking-tight font-mono">
            {alerts.length || 8}{' '}
            <span className="text-[13px] font-medium text-[#D70018] font-sans">SKU cần nhập</span>
          </div>
          <div className="mt-1 text-[11px] text-[#D70018]">
            <span>3 mã đã chạm mức 0 tuyệt đối</span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SEARCH & FILTER TOOLBAR (Screen 12)                                  */}
      {/* ===================================================================== */}
      <div className="p-3 bg-white border border-[#E5E7EB] space-y-2.5 rounded text-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center">
          {/* Search SKU / Barcode */}
          <div className="lg:col-span-4 relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo SKU, mã vạch, model, chipset..."
              className="w-full h-8 pl-8 pr-3 bg-white border border-[#D1D5DB] rounded text-[12px] text-gray-900 focus:outline-none focus:border-blue-700"
            />
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-8 pl-2.5 pr-7 bg-white border border-[#D1D5DB] rounded text-[12px] text-gray-700 focus:outline-none focus:border-blue-700"
            >
              <option value="all">Danh mục: Tất cả danh mục</option>
              <option value="laptop">Laptop Gaming &amp; Ultrabook</option>
              <option value="pc">Linh kiện PC (VGA, CPU, Mainboard)</option>
              <option value="màn hình">Màn hình đồ họa &amp; Gaming</option>
              <option value="bàn phím">Bàn phím &amp; Chuột cơ</option>
            </select>
          </div>

          {/* Stock Status Dropdown */}
          <div className="lg:col-span-3">
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              className="w-full h-8 pl-2.5 pr-7 bg-white border border-[#D1D5DB] rounded text-[12px] text-gray-700 focus:outline-none focus:border-blue-700"
            >
              <option value="all">Trạng thái: Tất cả trạng thái</option>
              <option value="low">Sắp hết hàng (&lt; ngưỡng)</option>
              <option value="out">Đã hết hàng (0 cái)</option>
              <option value="safe">Tồn kho an toàn</option>
            </select>
          </div>

          {/* Warehouse location */}
          <div className="lg:col-span-2">
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full h-8 pl-2.5 pr-7 bg-white border border-[#D1D5DB] rounded text-[12px] text-gray-700 focus:outline-none focus:border-blue-700"
            >
              <option value="tanbinh">Kho Q. Tân Bình</option>
              <option value="bitexco">Showroom Bitexco Q.1</option>
              <option value="all">Tất cả các kho vật lý</option>
            </select>
          </div>
        </div>

        {/* Quick filters pills */}
        <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] text-[12px] flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-medium text-[11px]">Lọc nhanh:</span>
            <button
              onClick={() => setQuickFilter('hot')}
              className={`h-6 px-2 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                quickFilter === 'hot'
                  ? 'bg-blue-50 border border-blue-200 text-blue-700'
                  : 'bg-white border border-[#D1D5DB] text-gray-600'
              }`}
            >
              <span>Hàng hot (Top 10%)</span>
              {quickFilter === 'hot' && (
                <span className="material-symbols-outlined text-[13px]">check</span>
              )}
            </button>
            <button
              onClick={() => setQuickFilter('audit')}
              className={`h-6 px-2 rounded text-[11px] transition-colors ${
                quickFilter === 'audit'
                  ? 'bg-blue-50 border border-blue-200 text-blue-700 font-medium'
                  : 'bg-white border border-[#D1D5DB] text-gray-600'
              }`}
            >
              Đang kiểm kê hôm nay
            </button>
            <button
              onClick={() => setQuickFilter('imei')}
              className={`h-6 px-2 rounded text-[11px] transition-colors ${
                quickFilter === 'imei'
                  ? 'bg-blue-50 border border-blue-200 text-blue-700 font-medium'
                  : 'bg-white border border-[#D1D5DB] text-gray-600'
              }`}
            >
              Có Serial/IMEI đặc biệt
            </button>
            <button
              onClick={() => setQuickFilter('gift')}
              className={`h-6 px-2 rounded text-[11px] transition-colors ${
                quickFilter === 'gift'
                  ? 'bg-blue-50 border border-blue-200 text-blue-700 font-medium'
                  : 'bg-white border border-[#D1D5DB] text-gray-600'
              }`}
            >
              Kèm quà tặng PO
            </button>
          </div>

          <div className="flex items-center gap-3 text-gray-500 text-[11px]">
            <span>
              Hiển thị <strong>{filteredVariants.length}</strong> trong{' '}
              <strong>{displayVariants.length}</strong> SKU
            </span>
            <button
              onClick={loadData}
              className="text-blue-700 hover:underline font-semibold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* INVENTORY TABLE: Dense 13px, thin row borders #E5E7EB, Price #D70018  */}
      {/* ===================================================================== */}
      <div className="bg-white border border-[#E5E7EB] overflow-hidden rounded">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-[#E5E7EB] text-gray-600 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-700 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3 min-w-[125px]">Mã SKU / Barcode</th>
                <th className="py-2.5 px-3 min-w-[280px]">Sản phẩm &amp; Cấu hình</th>
                <th className="py-2.5 px-3">Danh mục</th>
                <th className="py-2.5 px-3 text-right">Giá nhập bình quân</th>
                <th className="py-2.5 px-3 text-right text-gray-800">Giá niêm yết</th>
                <th className="py-2.5 px-3 text-center bg-gray-50">On-hand (Tồn kho)</th>
                <th className="py-2.5 px-3 text-center text-amber-700">Reserved (Đang giữ)</th>
                <th className="py-2.5 px-3 text-center font-bold text-blue-700 bg-blue-50">
                  Available (Khả dụng)
                </th>
                <th className="py-2.5 px-3 text-center">Ngưỡng</th>
                <th className="py-2.5 px-3">Trạng thái</th>
                <th className="py-2.5 px-3">Vị trí kệ</th>
                <th className="py-2.5 px-3 text-center w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                <tr>
                  <td colSpan={13} className="py-10 text-center text-gray-500">
                    <span className="material-symbols-outlined animate-spin text-2xl text-blue-600 block mb-2">
                      progress_activity
                    </span>
                    Đang đồng bộ số dư kho thực tế...
                  </td>
                </tr>
              ) : filteredVariants.map((item) => {
                const threshold = item.lowStockThreshold || 5;
                const isOutOfStock = item.availableQuantity <= 0;
                const isLowStock = item.availableQuantity < threshold && !isOutOfStock;

                return (
                  <tr key={item.variantId} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-700 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium">
                      <div className="text-[12px] font-semibold text-gray-900">{item.sku}</div>
                      <div className="text-[10px] text-gray-400">{item.barcode || '893849102481'}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          alt={item.productName}
                          src={item.thumbnailUrl || 'https://placehold.co/100x100?text=SP'}
                          className="w-9 h-9 rounded border border-[#E5E7EB] object-cover shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://placehold.co/100x100?text=SP';
                          }}
                        />
                        <div>
                          <div className="font-semibold text-gray-900 text-[12px] leading-tight line-clamp-1">
                            {item.productName}
                          </div>
                          <div className="text-[11px] text-gray-500 line-clamp-1">
                            {item.variantName || 'Cấu hình tiêu chuẩn'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 text-[12px]">
                      {item.categoryName || 'Linh kiện'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-600 text-[12px]">
                      {formatVND(item.costPrice || 50000000)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#D70018] text-[12px] font-semibold">
                      {formatVND(item.salePrice)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-medium text-gray-900">
                      {item.onHandQuantity}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-amber-700">
                      {item.reservedQuantity}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-center font-mono font-bold ${
                        isOutOfStock
                          ? 'text-[#D70018] bg-red-50'
                          : isLowStock
                          ? 'text-amber-800 bg-amber-50'
                          : 'text-emerald-700 bg-emerald-50'
                      }`}
                    >
                      {item.availableQuantity}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-gray-500 text-[11px]">
                      {threshold}
                    </td>
                    <td className="py-2.5 px-3">
                      {isOutOfStock ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#D70018] text-white">
                          Đã hết hàng (0)
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-[#D70018] border border-red-200">
                          Sắp hết: còn {item.availableQuantity}
                        </span>
                      ) : (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Khả dụng tốt
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[11px]">
                        {item.shelfLocation || 'A1-R02'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-500">
                        <button
                          onClick={() => {
                            setSelectedVariantForAdjust(item);
                            setIsAdjustModalOpen(true);
                          }}
                          className="p-1 hover:text-blue-700 rounded transition-colors"
                          title="Điều chỉnh số dư"
                        >
                          <span className="material-symbols-outlined text-[17px]">tune</span>
                        </button>
                        <button
                          onClick={() => setIsPoModalOpen(true)}
                          className="p-1 hover:text-emerald-700 rounded transition-colors"
                          title="Tạo đơn PO nhập hàng"
                        >
                          <span className="material-symbols-outlined text-[17px]">post_add</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="px-3.5 py-2.5 bg-gray-50 border-t border-[#E5E7EB] flex items-center justify-between text-[12px]">
          <div className="flex items-center gap-2 text-gray-500">
            <span>Hiển thị mỗi trang:</span>
            <select className="h-7 px-2 bg-white border border-[#D1D5DB] rounded text-[12px] font-medium text-gray-700">
              <option>10</option>
              <option defaultValue="20">20</option>
              <option>50</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="w-7 h-7 rounded border border-[#D1D5DB] bg-white text-gray-400 flex items-center justify-center hover:bg-gray-50"
              disabled
            >
              <span className="material-symbols-outlined text-[15px]">chevron_left</span>
            </button>
            <button className="w-7 h-7 rounded bg-blue-700 text-white font-semibold text-[11px] flex items-center justify-center">
              1
            </button>
            <button className="w-7 h-7 rounded border border-[#D1D5DB] bg-white text-gray-700 font-medium text-[11px] hover:bg-gray-50 flex items-center justify-center">
              2
            </button>
            <button className="w-7 h-7 rounded border border-[#D1D5DB] bg-white text-gray-700 font-medium text-[11px] hover:bg-gray-50 flex items-center justify-center">
              3
            </button>
            <span className="px-1 text-gray-400 text-[11px]">...</span>
            <button className="w-7 h-7 rounded border border-[#D1D5DB] bg-white text-gray-600 flex items-center justify-center hover:bg-gray-50">
              <span className="material-symbols-outlined text-[15px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* STOCK MOVEMENT LEDGER (Thẻ Sổ Nhật Ký Biến Động Kho) (Screen 12)       */}
      {/* ===================================================================== */}
      <div className="bg-white border border-[#E5E7EB] overflow-hidden rounded">
        <div className="p-3.5 border-b border-[#E5E7EB] flex items-center justify-between">
          <div>
            <h3 className="text-[14px] text-gray-900 leading-tight font-semibold">
              Thẻ Sổ Nhật Ký Biến Động Kho (Recent Stock Ledger)
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Ghi nhận minh bạch các giao dịch xuất - nhập - điều chỉnh kiểm kê thời gian thực
            </p>
          </div>
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="text-blue-700 text-[12px] font-semibold hover:underline flex items-center gap-1"
          >
            <span>Xem toàn bộ sổ nhật ký kho</span>
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px] border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-[11px] font-semibold uppercase tracking-wider border-b border-[#E5E7EB]">
                <th className="py-2.5 px-3">Thời gian</th>
                <th className="py-2.5 px-3">Mã chứng từ / GD</th>
                <th className="py-2.5 px-3">Loại nghiệp vụ kho</th>
                <th className="py-2.5 px-3">Nhân viên chịu trách nhiệm</th>
                <th className="py-2.5 px-3">Mã SKU ảnh hưởng</th>
                <th className="py-2.5 px-3 text-center">Biến động</th>
                <th className="py-2.5 px-3 text-center bg-gray-50">Số tồn sau GD</th>
                <th className="py-2.5 px-3">Ghi chú &amp; Căn cứ kiểm soát</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {displayMovements.map((m, idx) => (
                <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-gray-500 text-[11px]">{m.time}</td>
                  <td className="py-2.5 px-3 font-mono font-medium text-blue-700">{m.reference}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
                      <span className="material-symbols-outlined text-[12px]">local_mall</span>
                      {m.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-medium text-gray-900 block">{m.staff}</span>
                    <span className="text-[10px] text-gray-400">{m.warehouse}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-medium text-gray-900">{m.sku}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">
                    <span className={m.quantityChange > 0 ? 'text-emerald-700' : 'text-[#D70018]'}>
                      {m.quantityChange > 0 ? `+ ${m.quantityChange}` : `${m.quantityChange}`} cái
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-gray-700">{m.afterStock}</td>
                  <td className="py-2.5 px-3 text-gray-500 text-[11px]">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && selectedVariantForAdjust && (
        <StockAdjustmentModal
          isOpen={isAdjustModalOpen}
          onClose={() => {
            setIsAdjustModalOpen(false);
            setSelectedVariantForAdjust(null);
          }}
          variant={selectedVariantForAdjust}
          onSuccess={() => {
            loadData();
            setIsAdjustModalOpen(false);
            setSelectedVariantForAdjust(null);
          }}
        />
      )}

      {/* Purchase Order Modal */}
      {isPoModalOpen && (
        <CreatePurchaseOrderModal
          isOpen={isPoModalOpen}
          onClose={() => setIsPoModalOpen(false)}
          variants={variants.length > 0 ? variants : (displayVariants as VariantInventoryItemDto[])}
          onSuccess={() => {
            loadData();
            setIsPoModalOpen(false);
          }}
        />
      )}

      {/* Inventory Audit Modal */}
      {isAuditModalOpen && (
        <InventoryAuditModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          variants={variants.length > 0 ? variants : (displayVariants as VariantInventoryItemDto[])}
          onSuccess={() => {
            loadData();
            setIsAuditModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default AdminInventoryPage;
