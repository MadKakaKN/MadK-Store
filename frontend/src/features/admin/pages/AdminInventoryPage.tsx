import React, { useState, useEffect, useMemo } from 'react';
import DataTable, { ColumnDef } from '../components/common/DataTable';
import Badge, { BadgeVariant } from '../components/common/Badge';
import ConfirmModal from '../components/common/ConfirmModal';
import { FormField, AdminInput } from '../components/common/AdminForm';
import { useToast } from '../components/common/ToastContext';
import {
  InventoryAuditDto,
  InventoryAuditStatus,
  LowStockAlertDto,
  PurchaseOrderDto,
  PurchaseOrderStatus,
  StockMovementDto,
  StockMovementType,
  SupplierDto,
  VariantInventoryItemDto,
} from '../../../types/inventory';
import { adminInventoryApi } from '../../../api/adminInventoryApi';
import { StockAdjustmentModal } from '../inventory/StockAdjustmentModal';
import { CreatePurchaseOrderModal } from '../inventory/CreatePurchaseOrderModal';
import { InventoryAuditModal } from '../inventory/InventoryAuditModal';

type ActiveTab = 'inventory' | 'purchasing' | 'audit' | 'movements';

export const AdminInventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory');
  const [loading, setLoading] = useState<boolean>(true);
  const [variants, setVariants] = useState<VariantInventoryItemDto[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDto[]>([]);
  const [audits, setAudits] = useState<InventoryAuditDto[]>([]);
  const [movements, setMovements] = useState<StockMovementDto[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlertDto[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all');

  // Modals state
  const [selectedVariantForRestock, setSelectedVariantForRestock] = useState<VariantInventoryItemDto | null>(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState<boolean>(false);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockReason, setRestockReason] = useState<string>('Nhập hàng bổ sung');

  const [selectedVariantForAdjust, setSelectedVariantForAdjust] = useState<VariantInventoryItemDto | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);

  const [isPoModalOpen, setIsPoModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState<boolean>(false);
  const [newSupCode, setNewSupCode] = useState<string>('');
  const [newSupName, setNewSupName] = useState<string>('');
  const [newSupPhone, setNewSupPhone] = useState<string>('');
  const [newSupEmail, setNewSupEmail] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const toast = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, sRes, poRes, aRes, mRes, alertRes] = await Promise.all([
        adminInventoryApi.getVariantInventories(),
        adminInventoryApi.getSuppliers(),
        adminInventoryApi.getPurchaseOrders(),
        adminInventoryApi.getAudits(),
        adminInventoryApi.getMovements(),
        adminInventoryApi.getLowStockAlerts(5),
      ]);

      if (vRes.isSuccess && vRes.data) setVariants(vRes.data);
      if (sRes.isSuccess && sRes.data) setSuppliers(sRes.data);
      if (poRes.isSuccess && poRes.data) setPurchaseOrders(poRes.data);
      if (aRes.isSuccess && aRes.data) setAudits(aRes.data);
      if (mRes.isSuccess && mRes.data) setMovements(mRes.data);
      if (alertRes.isSuccess && alertRes.data) setAlerts(alertRes.data);
    } catch {
      toast.error('Lỗi khi tải dữ liệu kho hàng.', 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered variants
  const filteredVariants = useMemo(() => {
    return variants.filter((v) => {
      const matchSearch =
        !searchQuery ||
        v.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.variantName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (stockStatusFilter === 'out_of_stock') return v.availableQuantity === 0;
      if (stockStatusFilter === 'low_stock') return v.availableQuantity > 0 && v.availableQuantity <= 5;
      if (stockStatusFilter === 'in_stock') return v.availableQuantity > 5;
      return true;
    });
  }, [variants, searchQuery, stockStatusFilter]);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (movementTypeFilter === 'all') return true;
      return m.type === parseInt(movementTypeFilter);
    });
  }, [movements, movementTypeFilter]);

  // Stock summary metrics
  const totalOnHand = variants.reduce((sum, v) => sum + v.onHandQuantity, 0);
  const totalReserved = variants.reduce((sum, v) => sum + v.reservedQuantity, 0);
  const totalAvailable = variants.reduce((sum, v) => sum + v.availableQuantity, 0);
  const outOfStockCount = variants.filter((v) => v.availableQuantity === 0).length;

  // Handlers for Quick Restock
  const handleOpenRestock = (v: VariantInventoryItemDto) => {
    setSelectedVariantForRestock(v);
    setRestockQty(10);
    setRestockReason('Nhập hàng bổ sung vào kho');
    setIsRestockModalOpen(true);
  };

  const handleConfirmRestock = async () => {
    if (!selectedVariantForRestock || restockQty <= 0) {
      toast.warning('Số lượng nhập phải lớn hơn 0.', 'Cảnh báo');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminInventoryApi.restock(
        selectedVariantForRestock.variantId,
        restockQty,
        restockReason
      );

      if (res.isSuccess) {
        toast.success(
          `Đã nhập thêm ${restockQty} sản phẩm cho SKU: ${selectedVariantForRestock.sku}`,
          'Nhập kho thành công'
        );
        setIsRestockModalOpen(false);
        loadData();
      } else {
        toast.error(res.error || 'Nhập kho thất bại.', 'Lỗi');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi nhập kho.', 'Lỗi hệ thống');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Receiving Purchase Order
  const handleReceivePo = async (poId: string, poCode: string) => {
    try {
      const res = await adminInventoryApi.receivePurchaseOrder(poId);
      if (res.isSuccess) {
        toast.success(
          `Đã nhận hàng thành công theo phiếu ${poCode}! Tồn kho và giá vốn đã được cập nhật.`,
          'Hoàn tất nhập hàng'
        );
        loadData();
      } else {
        toast.error(res.error || 'Lỗi khi nhận hàng vào kho.', 'Lỗi');
      }
    } catch {
      toast.error('Có lỗi khi xử lý nhận hàng.', 'Lỗi hệ thống');
    }
  };

  // Handlers for Adding Supplier
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupCode.trim() || !newSupName.trim()) {
      toast.warning('Vui lòng nhập mã và tên nhà cung cấp.', 'Cảnh báo');
      return;
    }

    try {
      const res = await adminInventoryApi.createSupplier({
        code: newSupCode.trim().toUpperCase(),
        name: newSupName.trim(),
        phone: newSupPhone.trim(),
        email: newSupEmail.trim(),
      });

      if (res.isSuccess) {
        toast.success(`Đã thêm nhà cung cấp ${newSupName}`, 'Thành công');
        setIsNewSupplierModalOpen(false);
        setNewSupCode('');
        setNewSupName('');
        setNewSupPhone('');
        setNewSupEmail('');
        loadData();
      } else {
        toast.error(res.error || 'Thêm NCC thất bại.', 'Lỗi');
      }
    } catch {
      toast.error('Lỗi khi thêm nhà cung cấp.', 'Lỗi hệ thống');
    }
  };

  // Helper for Movement Type formatting
  const renderMovementTypeBadge = (type: StockMovementType) => {
    switch (type) {
      case StockMovementType.Restock:
        return <Badge variant="success" size="sm">Nhập kho (Restock)</Badge>;
      case StockMovementType.Reserve:
        return <Badge variant="warning" size="sm">Giữ hàng (Reserve)</Badge>;
      case StockMovementType.Release:
        return <Badge variant="info" size="sm">Giải phóng (Release)</Badge>;
      case StockMovementType.Commit:
        return <Badge variant="neutral" size="sm">Xuất kho (Commit)</Badge>;
      case StockMovementType.Adjustment:
        return <Badge variant="danger" size="sm">Điều chỉnh (Adjustment)</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Khác</Badge>;
    }
  };

  // Columns for Inventory Table
  const inventoryColumns: ColumnDef<VariantInventoryItemDto>[] = [
    {
      key: 'product',
      title: 'Sản phẩm & Biến thể',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.thumbnailUrl && (
            <img
              src={row.thumbnailUrl}
              alt={row.variantName}
              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
            />
          )}
          <div className="min-w-0">
            <div className="font-bold text-xs text-slate-900 truncate max-w-xs">{row.productName}</div>
            <div className="text-[11px] text-slate-500 truncate max-w-xs">{row.variantName}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[10px] font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded">
                {row.sku}
              </span>
              {row.categoryName && (
                <span className="text-[10px] text-slate-400">· {row.categoryName}</span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'costPrice',
      title: 'Giá vốn',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-xs text-slate-700">
          {row.costPrice > 0 ? `${row.costPrice.toLocaleString('vi-VN')} đ` : 'Chưa có'}
        </span>
      ),
    },
    {
      key: 'onHand',
      title: 'Tồn thực (OnHand)',
      align: 'center',
      render: (row) => <span className="font-bold text-xs text-slate-900">{row.onHandQuantity}</span>,
    },
    {
      key: 'reserved',
      title: 'Đang giữ (Reserved)',
      align: 'center',
      render: (row) => (
        <span className="font-semibold text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
          {row.reservedQuantity}
        </span>
      ),
    },
    {
      key: 'available',
      title: 'Khả dụng (Available)',
      align: 'center',
      render: (row) => {
        let variant: BadgeVariant = 'success';
        let text = `${row.availableQuantity} SP`;
        if (row.availableQuantity === 0) {
          variant = 'danger';
          text = 'Hết hàng';
        } else if (row.availableQuantity <= 5) {
          variant = 'warning';
          text = `Sắp hết (${row.availableQuantity})`;
        }

        return (
          <Badge variant={variant} dot size="sm">
            {text}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenRestock(row)}
            className="px-2 py-1 text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg transition-colors"
            title="Nhập thêm hàng nhanh"
          >
            + Nhập kho
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedVariantForAdjust(row);
              setIsAdjustModalOpen(true);
            }}
            className="px-2 py-1 text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
            title="Điều chỉnh số lượng kèm lý do"
          >
            ⚡ Điều chỉnh
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm">
          <span className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          Đang tải dữ liệu kho hàng...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản Trị Kho & Mua Hàng</h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý tồn kho đa biến thể, kiểm soát xuất/nhập/giữ hàng, phiếu nhập nhà cung cấp và kiểm kê định kỳ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPoModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all flex items-center gap-1.5"
          >
            📦 Tạo phiếu nhập hàng
          </button>
          <button
            type="button"
            onClick={() => setIsAuditModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-all flex items-center gap-1.5"
          >
            📋 Kiểm kê kho
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tổng mã SKU</span>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{variants.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
            🏷️
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tồn kho vật lý (OnHand)</span>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalOnHand}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-700 font-bold">
            🏢
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Đang giữ cho đơn (Reserved)</span>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{totalReserved}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
            ⏳
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Khả dụng để bán (Available)</span>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{totalAvailable}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
            ✅
          </div>
        </div>
      </div>

      {/* Low Stock Warning Alert if any */}
      {alerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-amber-900">
              Cảnh báo: Có {alerts.length} biến thể đang sắp hết hoặc hết hàng ({outOfStockCount} hết hàng, {alerts.length - outOfStockCount} sắp hết)
            </h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {alerts.slice(0, 5).map((a) => (
                <span
                  key={a.variantId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-[11px] font-semibold text-amber-900 shadow-2xs"
                >
                  <span className="font-mono text-slate-700">{a.sku}</span>:
                  <strong className={a.availableQuantity === 0 ? 'text-rose-600' : 'text-amber-700'}>
                    {a.availableQuantity} SP
                  </strong>
                </span>
              ))}
              {alerts.length > 5 && (
                <span className="text-xs text-amber-800 font-semibold self-center">
                  +{alerts.length - 5} mặt hàng khác
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-1">
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📦 Tồn kho theo biến thể ({variants.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('purchasing')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'purchasing'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🛒 Nhà cung cấp & Phiếu nhập ({purchaseOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📋 Kiểm kê kho ({audits.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'movements'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📜 Sổ cái biến động kho ({movements.length})
        </button>
      </div>

      {/* TAB 1: INVENTORY VARIANTS */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Lọc tồn:</span>
              <button
                type="button"
                onClick={() => setStockStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  stockStatusFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setStockStatusFilter('in_stock')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  stockStatusFilter === 'in_stock'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Còn hàng (&gt;5)
              </button>
              <button
                type="button"
                onClick={() => setStockStatusFilter('low_stock')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  stockStatusFilter === 'low_stock'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Sắp hết (1-5)
              </button>
              <button
                type="button"
                onClick={() => setStockStatusFilter('out_of_stock')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  stockStatusFilter === 'out_of_stock'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Hết hàng (0)
              </button>
            </div>
          </div>

          <DataTable
            columns={inventoryColumns}
            data={filteredVariants}
            keyExtractor={(item) => item.variantId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Tìm kiếm SKU, tên sản phẩm hoặc biến thể..."
            currentPage={1}
            pageSize={15}
            onPageChange={() => {}}
          />
        </div>
      )}

      {/* TAB 2: PURCHASING & SUPPLIERS */}
      {activeTab === 'purchasing' && (
        <div className="space-y-6">
          {/* Purchase Orders Section */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Danh sách phiếu nhập hàng (Purchase Orders)</h3>
                <p className="text-xs text-slate-500">Theo dõi các đơn nhập hàng từ nhà cung cấp và ghi nhận giá vốn</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPoModalOpen(true)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all"
              >
                + Tạo phiếu nhập mới
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Mã phiếu</th>
                    <th className="py-2.5 px-3">Nhà cung cấp</th>
                    <th className="py-2.5 px-3 text-center">Số mặt hàng</th>
                    <th className="py-2.5 px-3 text-right">Tổng giá vốn</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái</th>
                    <th className="py-2.5 px-3">Thời gian</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{po.code}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{po.supplierName || 'N/A'}</td>
                      <td className="py-2.5 px-3 text-center font-semibold">{po.items?.length || 0}</td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">
                        {po.totalAmount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {po.status === PurchaseOrderStatus.Received ? (
                          <Badge variant="success" size="sm">Đã nhập kho</Badge>
                        ) : po.status === PurchaseOrderStatus.Cancelled ? (
                          <Badge variant="danger" size="sm">Đã hủy</Badge>
                        ) : (
                          <Badge variant="warning" size="sm">Bản nháp</Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Date(po.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {po.status === PurchaseOrderStatus.Draft && (
                          <button
                            type="button"
                            onClick={() => handleReceivePo(po.id, po.code)}
                            className="px-2.5 py-1 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors shadow-2xs"
                          >
                            ✓ Nhận hàng
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Suppliers Management */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Nhà cung cấp đối tác ({suppliers.length})</h3>
                <p className="text-xs text-slate-500">Thông tin liên hệ nhà phân phối linh kiện và thiết bị công nghệ</p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewSupplierModalOpen(true)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl text-slate-800 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                + Thêm nhà cung cấp
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suppliers.map((s) => (
                <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                      {s.code}
                    </span>
                    <Badge variant={s.isActive ? 'success' : 'neutral'} size="sm">
                      {s.isActive ? 'Đang hợp tác' : 'Ngưng'}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{s.name}</h4>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    {s.contactPerson && <p>👤 Người liên hệ: {s.contactPerson}</p>}
                    {s.phone && <p>📞 Hotline/Zalo: {s.phone}</p>}
                    {s.email && <p>✉️ Email: {s.email}</p>}
                    {s.address && <p>📍 Địa chỉ: {s.address}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INVENTORY AUDIT */}
      {activeTab === 'audit' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Lịch sử các đợt kiểm kê kho</h3>
              <p className="text-xs text-slate-500">
                So khớp số đếm thực tế với số liệu hệ thống và tự động cân bằng kho
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAuditModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all"
            >
              + Bắt đầu kiểm kê định kỳ
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Mã kiểm kê</th>
                  <th className="py-2.5 px-3">Ghi chú</th>
                  <th className="py-2.5 px-3 text-center">Số lượng mặt hàng</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  <th className="py-2.5 px-3">Người kiểm</th>
                  <th className="py-2.5 px-3">Thời gian hoàn tất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {audits.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{a.code}</td>
                    <td className="py-2.5 px-3 text-slate-700">{a.notes || 'Kiểm kê định kỳ'}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{a.items?.length || 0}</td>
                    <td className="py-2.5 px-3 text-center">
                      {a.status === InventoryAuditStatus.Completed ? (
                        <Badge variant="success" size="sm">Đã cân bằng kho</Badge>
                      ) : (
                        <Badge variant="warning" size="sm">Đang kiểm đếm</Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{a.createdBy || 'Staff'}</td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {a.completedAt ? new Date(a.completedAt).toLocaleString('vi-VN') : '---'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: STOCK MOVEMENTS LEDGER */}
      {activeTab === 'movements' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sổ cái lịch sử biến động kho (Stock Movements)</h3>
              <p className="text-xs text-slate-500">Truy vết toàn bộ lịch sử Nhập, Giữ, Giải phóng, Xuất kho và Điều chỉnh</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Loại biến động:</span>
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="text-xs font-semibold rounded-lg border border-slate-200 bg-white py-1 px-2.5 text-slate-700 focus:ring-1 focus:ring-brand-500"
              >
                <option value="all">Tất cả biến động</option>
                <option value={StockMovementType.Restock}>Nhập kho (Restock)</option>
                <option value={StockMovementType.Reserve}>Giữ hàng (Reserve)</option>
                <option value={StockMovementType.Release}>Giải phóng (Release)</option>
                <option value={StockMovementType.Commit}>Xuất kho (Commit)</option>
                <option value={StockMovementType.Adjustment}>Điều chỉnh (Adjustment)</option>
              </select>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Thời gian</th>
                  <th className="py-2.5 px-3">Phân loại</th>
                  <th className="py-2.5 px-3">Biến thể / SKU</th>
                  <th className="py-2.5 px-3 text-center">Số lượng</th>
                  <th className="py-2.5 px-3 text-center">OnHand (Trước → Sau)</th>
                  <th className="py-2.5 px-3 text-center">Reserved (Trước → Sau)</th>
                  <th className="py-2.5 px-3">Tham chiếu</th>
                  <th className="py-2.5 px-3">Lý do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.map((m) => {
                  const variant = variants.find((v) => v.variantId === m.variantId);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3">{renderMovementTypeBadge(m.type)}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                          {variant?.sku || m.variantId.slice(0, 8)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">{m.quantity}</td>
                      <td className="py-2.5 px-3 text-center text-slate-700">
                        {m.onHandBefore} → <strong className="text-slate-900">{m.onHandAfter}</strong>
                      </td>
                      <td className="py-2.5 px-3 text-center text-amber-700">
                        {m.reservedBefore} → <strong className="text-amber-800">{m.reservedAfter}</strong>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[11px] text-slate-600">
                          {m.referenceType || '---'} {m.referenceId ? `(${m.referenceId})` : ''}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={m.reason || ''}>
                        {m.reason || '---'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Quick Restock Modal */}
      <ConfirmModal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        onConfirm={handleConfirmRestock}
        title="Nhập thêm hàng nhanh vào kho (Restock)"
        message={
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Nhập kho cho sản phẩm: <strong className="text-slate-900">{selectedVariantForRestock?.sku}</strong>
            </p>

            <FormField label="Số lượng nhập" required>
              <AdminInput
                type="number"
                min={1}
                value={restockQty}
                onChange={(e) => setRestockQty(parseInt(e.target.value) || 0)}
              />
            </FormField>

            <FormField label="Lý do nhập kho">
              <AdminInput
                type="text"
                value={restockReason}
                onChange={(e) => setRestockReason(e.target.value)}
                placeholder="Nhập ghi chú hoặc lý do nhập hàng..."
              />
            </FormField>
          </div>
        }
        confirmText="Xác nhận nhập kho"
        isLoading={isSubmitting}
      />

      {/* MODAL 2: Stock Adjustment Modal (With available stock validation) */}
      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        variant={selectedVariantForAdjust}
        onClose={() => setIsAdjustModalOpen(false)}
        onSuccess={loadData}
      />

      {/* MODAL 3: Create Purchase Order Modal */}
      <CreatePurchaseOrderModal
        isOpen={isPoModalOpen}
        variants={variants}
        onClose={() => setIsPoModalOpen(false)}
        onSuccess={loadData}
      />

      {/* MODAL 4: Inventory Audit Modal */}
      <InventoryAuditModal
        isOpen={isAuditModalOpen}
        variants={variants}
        onClose={() => setIsAuditModalOpen(false)}
        onSuccess={loadData}
      />

      {/* MODAL 5: Quick Add Supplier Modal */}
      {isNewSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Thêm Nhà Cung Cấp Mới</h3>
              <button
                type="button"
                onClick={() => setIsNewSupplierModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <FormField label="Mã nhà cung cấp" required>
                <AdminInput
                  type="text"
                  placeholder="VD: SUP-SONY-VN"
                  value={newSupCode}
                  onChange={(e) => setNewSupCode(e.target.value.toUpperCase())}
                />
              </FormField>

              <FormField label="Tên nhà cung cấp" required>
                <AdminInput
                  type="text"
                  placeholder="Tên công ty hoặc đại diện phân phối..."
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                />
              </FormField>

              <FormField label="Hotline / Số điện thoại">
                <AdminInput
                  type="text"
                  placeholder="0988xxxxxx"
                  value={newSupPhone}
                  onChange={(e) => setNewSupPhone(e.target.value)}
                />
              </FormField>

              <FormField label="Email liên hệ">
                <AdminInput
                  type="email"
                  placeholder="supplier@company.com"
                  value={newSupEmail}
                  onChange={(e) => setNewSupEmail(e.target.value)}
                />
              </FormField>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewSupplierModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm"
                >
                  Lưu nhà cung cấp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventoryPage;
