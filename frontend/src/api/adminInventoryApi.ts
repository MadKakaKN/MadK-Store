import apiClient from './apiClient';
import { handleApiError } from './authApi';
import { ApiEnvelope } from '../types/auth';
import {
  AdjustStockRequestDto,
  CompleteInventoryAuditDto,
  CreateInventoryAuditDto,
  CreatePurchaseOrderDto,
  CreateSupplierDto,
  InventoryAuditDto,
  InventoryAuditStatus,
  InventoryDto,
  LowStockAlertDto,
  PurchaseOrderDto,
  PurchaseOrderQueryFilter,
  PurchaseOrderStatus,
  StockMovementDto,
  StockMovementQueryFilter,
  StockMovementType,
  SupplierDto,
  UpdateSupplierDto,
  VariantInventoryItemDto,
} from '../types/inventory';
import { MOCK_PRODUCTS } from './mockData';

// In-memory store for offline fallback operations
let mockVariants: VariantInventoryItemDto[] = MOCK_PRODUCTS.flatMap((p) =>
  p.variants.map((v) => {
    const onHand = v.stockQuantity || 25;
    const reserved = Math.min(2, Math.floor(onHand * 0.1));
    return {
      variantId: v.id,
      productId: p.id,
      sku: v.sku,
      productName: p.name,
      variantName: v.name,
      thumbnailUrl: p.thumbnailUrl || null,
      onHandQuantity: onHand,
      reservedQuantity: reserved,
      availableQuantity: Math.max(0, onHand - reserved),
      minStockThreshold: 5,
      costPrice: v.costPrice || Math.round(v.salePrice * 0.75),
      salePrice: v.salePrice,
      updatedAt: '2026-11-01T12:00:00Z',
    };
  })
);

// Dữ liệu nhà cung cấp thực tế đồng bộ từ cơ sở dữ liệu Supabase public.suppliers
let mockSuppliers: SupplierDto[] = [
  {
    id: 'a1000000-0000-0000-0000-000000000001',
    code: 'SUP-FPT',
    name: 'Công ty TNHH Phân phối Synnex FPT',
    contactPerson: 'Nguyễn Minh Tuấn',
    phone: '02473006666',
    email: 'contact@synnexfpt.com',
    address: 'Tòa nhà FPT, Phố Duy Tân, Cầu Giấy, Hà Nội',
    isActive: true,
    notes: 'Nhà phân phối chính hãng Apple, ASUS, Dell, HP, Intel tại Việt Nam',
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-01T08:00:00Z',
  },
  {
    id: 'a1000000-0000-0000-0000-000000000002',
    code: 'SUP-DGW',
    name: 'Công ty Cổ phần Thế Giới Số (Digiworld)',
    contactPerson: 'Trần Hoàng Nam',
    phone: '02839290059',
    email: 'info@dgw.com.vn',
    address: '195 Điện Biên Phủ, Phường 15, Bình Thạnh, TP. Hồ Chí Minh',
    isActive: true,
    notes: 'Nhà phân phối độc quyền Xiaomi, MSI, Acer, HP, Logitech',
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-01T08:00:00Z',
  },
  {
    id: 'a1000000-0000-0000-0000-000000000003',
    code: 'SUP-VTL',
    name: 'Công ty TNHH MTV Thương mại & XNK Viettel',
    contactPerson: 'Lê Quốc Huy',
    phone: '02462776888',
    email: 'distribution@viettel.com.vn',
    address: 'Số 1 Trần Hữu Dực, Mỹ Đình 2, Nam Từ Liêm, Hà Nội',
    isActive: true,
    notes: 'Phân phối thiết bị viễn thông, điện thoại Samsung, Apple, thiết bị mạng',
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-01T08:00:00Z',
  },
  {
    id: 'a1000000-0000-0000-0000-000000000004',
    code: 'SUP-PET',
    name: 'Tổng Công ty Cổ phần Dịch vụ Tổng hợp Dầu khí (Petrosetco)',
    contactPerson: 'Vũ Đình Khoa',
    phone: '02839117777',
    email: 'contact@petrosetco.com.vn',
    address: 'Lầu 6, Tòa nhà PetroVietnam, 1-5 Lê Duẩn, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    isActive: true,
    notes: 'Đại lý phân phối ủy quyền Apple, Samsung, linh kiện máy tính cao cấp',
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-01T08:00:00Z',
  },
  {
    id: 'a1000000-0000-0000-0000-000000000005',
    code: 'SUP-SPC',
    name: 'Công ty Cổ phần Máy tính Vĩnh Xuân (SPC)',
    contactPerson: 'Phạm Hải Đăng',
    phone: '02432242138',
    email: 'kinhdoanh@spc.com.vn',
    address: 'Số 9 Ngõ 117 Thái Hà, Đống Đa, Hà Nội',
    isActive: true,
    notes: 'Phân phối linh kiện ASUS ROG, Gigabyte, Kingston, Corsair, Cooler Master',
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-01T08:00:00Z',
  },
];

let mockMovements: StockMovementDto[] = [];

// Dữ liệu đơn nhập hàng thực tế đồng bộ từ cơ sở dữ liệu Supabase public.purchase_orders
let mockPurchaseOrders: PurchaseOrderDto[] = [
  {
    id: 'b1000000-0000-0000-0000-000000000001',
    code: 'PO-2026-001',
    supplierId: 'a1000000-0000-0000-0000-000000000001',
    supplierName: 'Công ty TNHH Phân phối Synnex FPT',
    status: PurchaseOrderStatus.Received,
    totalAmount: 173950000,
    notes: 'Lô hàng nhập đợt 1 Apple iPhone 15 Pro Max chính hãng từ Synnex FPT',
    createdBy: 'Trần Văn Kho',
    receivedAt: '2026-11-01T15:00:00Z',
    createdAt: '2026-10-30T09:00:00Z',
    items: [
      {
        id: 'poi-1001',
        purchaseOrderId: 'b1000000-0000-0000-0000-000000000001',
        variantId: '6b078eb7-b339-46fa-bb16-818a3989d3c9',
        variantSku: 'IP15PM-1TB-BLK',
        variantName: 'iPhone 15 Pro Max 1TB Titan Đen',
        productName: 'iPhone 15 Pro Max',
        quantity: 2,
        unitCost: 34492500,
        totalCost: 68985000,
      },
      {
        id: 'poi-1002',
        purchaseOrderId: 'b1000000-0000-0000-0000-000000000001',
        variantId: '17b1c0b2-c18b-4c2b-91e4-c86f61aa18d9',
        variantSku: 'IP15PM-512-BLU',
        variantName: 'iPhone 15 Pro Max 512GB Titan Xanh',
        productName: 'iPhone 15 Pro Max',
        quantity: 3,
        unitCost: 34988333,
        totalCost: 104965000,
      },
    ],
  },
  {
    id: 'b1000000-0000-0000-0000-000000000002',
    code: 'PO-2026-002',
    supplierId: 'a1000000-0000-0000-0000-000000000002',
    supplierName: 'Công ty Cổ phần Thế Giới Số (Digiworld)',
    status: PurchaseOrderStatus.Received,
    totalAmount: 68100000,
    notes: 'Nhập lô linh kiện SSD Samsung 990 Pro và Chuột Razer Viper V3 từ Digiworld',
    createdBy: 'Trần Văn Kho',
    receivedAt: '2026-11-03T10:00:00Z',
    createdAt: '2026-11-02T08:30:00Z',
    items: [
      {
        id: 'poi-2001',
        purchaseOrderId: 'b1000000-0000-0000-0000-000000000002',
        variantId: '3991798e-bc97-4fe5-b3e4-c51fc556c44b',
        variantSku: 'SAM-990P-2TB',
        variantName: 'Samsung 990 PRO NVMe M.2 2TB',
        productName: 'Ổ cứng SSD Samsung 990 PRO M.2 NVMe PCIe 4.0 2TB',
        quantity: 10,
        unitCost: 3667500,
        totalCost: 36675000,
      },
      {
        id: 'poi-2002',
        purchaseOrderId: 'b1000000-0000-0000-0000-000000000002',
        variantId: '08b84778-99de-42b0-bca4-f9ee8bf1a34c',
        variantSku: 'VIP3P-BLK',
        variantName: 'Razer Viper V3 Pro Đen',
        productName: 'Chuột gaming Razer Viper V3 Pro',
        quantity: 10,
        unitCost: 3142500,
        totalCost: 31425000,
      },
    ],
  },
  {
    id: 'b1000000-0000-0000-0000-000000000003',
    code: 'PO-2026-003',
    supplierId: 'a1000000-0000-0000-0000-000000000005',
    supplierName: 'Công ty Cổ phần Máy tính Vĩnh Xuân (SPC)',
    status: PurchaseOrderStatus.Draft,
    totalAmount: 40425000,
    notes: 'Đơn dự trù nhập CPU AMD Ryzen 7600X và Bàn phím cơ Corsair từ SPC Vĩnh Xuân',
    createdBy: 'Trần Văn Kho',
    receivedAt: null,
    createdAt: '2026-11-04T08:00:00Z',
    items: [
      {
        id: 'poi-3001',
        purchaseOrderId: 'b1000000-0000-0000-0000-000000000003',
        variantId: '809c516b-1269-4c08-ae8d-5e7a57ae5733',
        variantSku: 'AMD-7600X',
        variantName: 'AMD Ryzen 5 7600X Box',
        productName: 'CPU AMD Ryzen 5 7600X',
        quantity: 5,
        unitCost: 4342500,
        totalCost: 21712500,
      },
      {
        id: 'poi-3002',
        purchaseOrderId: 'b1000000-0000-0000-0000-000000000003',
        variantId: '7fea6949-fb4d-4fae-a77b-72a09ec194c9',
        variantSku: 'COR-K70MAX',
        variantName: 'Corsair K70 MAX MGX Magnetic Switch',
        productName: 'Bàn phím cơ Corsair K70 MAX RGB',
        quantity: 5,
        unitCost: 3742500,
        totalCost: 18712500,
      },
    ],
  },
];
let mockAudits: InventoryAuditDto[] = [];

export const adminInventoryApi = {
  // --- INVENTORY MANAGEMENT ---

  /**
   * Lấy danh sách tồn kho chi tiết các biến thể
   */
  async getVariantInventories(search?: string): Promise<ApiEnvelope<VariantInventoryItemDto[]>> {
    try {
      const res = await apiClient.get<ApiEnvelope<VariantInventoryItemDto[]>>(
        '/admin/inventory/variants',
        { params: { search } }
      );
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => {
        let filtered = [...mockVariants];
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(
            (v) =>
              v.productName.toLowerCase().includes(q) ||
              v.variantName.toLowerCase().includes(q) ||
              v.sku.toLowerCase().includes(q)
          );
        }
        return { isSuccess: true, data: filtered, message: 'Lấy danh sách tồn kho thành công.' };
      });
    }
  },

  /**
   * Nhập hàng nhanh vào kho (Restock)
   */
  async restock(variantId: string, quantity: number, reason?: string): Promise<ApiEnvelope<InventoryDto>> {
    try {
      const res = await apiClient.post<ApiEnvelope<InventoryDto>>('/admin/inventory/restock', {
        variantId,
        quantity,
        reason,
      });
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => {
        const target = mockVariants.find((v) => v.variantId === variantId);
        if (target) {
          target.onHandQuantity += quantity;
          target.availableQuantity += quantity;
          target.updatedAt = new Date().toISOString();

          mockMovements.unshift({
            id: `mov-${Date.now()}`,
            variantId,
            type: StockMovementType.Restock,
            quantity,
            onHandBefore: target.onHandQuantity - quantity,
            onHandAfter: target.onHandQuantity,
            reservedBefore: target.reservedQuantity,
            reservedAfter: target.reservedQuantity,
            referenceType: 'Manual',
            reason: reason || 'Nhập hàng vào kho',
            createdAt: new Date().toISOString(),
          });
        }
        return {
          isSuccess: true,
          data: {
            id: `inv-${variantId}`,
            variantId,
            onHandQuantity: target?.onHandQuantity || 0,
            reservedQuantity: target?.reservedQuantity || 0,
            availableQuantity: target?.availableQuantity || 0,
            updatedAt: new Date().toISOString(),
          },
          message: 'Nhập kho thành công.',
        };
      });
    }
  },

  /**
   * Điều chỉnh tồn kho có lý do (Adjust Stock)
   */
  async adjustStock(payload: AdjustStockRequestDto): Promise<ApiEnvelope<InventoryDto>> {
    try {
      const res = await apiClient.post<ApiEnvelope<InventoryDto>>('/admin/inventory/adjust', payload);
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => {
        const target = mockVariants.find((v) => v.variantId === payload.variantId);
        if (!target) {
          return { isSuccess: false, error: 'Không tìm thấy biến thể sản phẩm.' };
        }

        if (payload.quantityChange === 0) {
          return { isSuccess: false, error: 'Số lượng điều chỉnh phải khác 0.' };
        }

        if (payload.quantityChange < 0 && target.onHandQuantity + payload.quantityChange < target.reservedQuantity) {
          return {
            isSuccess: false,
            error: `Số lượng điều chỉnh giảm (${Math.abs(payload.quantityChange)}) vượt quá tồn kho khả dụng (${target.availableQuantity}).`,
          };
        }

        const onHandBefore = target.onHandQuantity;
        target.onHandQuantity += payload.quantityChange;
        target.availableQuantity = Math.max(0, target.onHandQuantity - target.reservedQuantity);
        target.updatedAt = new Date().toISOString();

        mockMovements.unshift({
          id: `mov-${Date.now()}`,
          variantId: payload.variantId,
          type: StockMovementType.Adjustment,
          quantity: Math.abs(payload.quantityChange),
          onHandBefore,
          onHandAfter: target.onHandQuantity,
          reservedBefore: target.reservedQuantity,
          reservedAfter: target.reservedQuantity,
          referenceType: payload.referenceType || 'StockAdjustment',
          referenceId: payload.referenceId,
          reason: payload.reason,
          createdAt: new Date().toISOString(),
        });

        return {
          isSuccess: true,
          data: {
            id: `inv-${payload.variantId}`,
            variantId: payload.variantId,
            onHandQuantity: target.onHandQuantity,
            reservedQuantity: target.reservedQuantity,
            availableQuantity: target.availableQuantity,
            updatedAt: new Date().toISOString(),
          },
          message: 'Điều chỉnh tồn kho thành công.',
        };
      });
    }
  },

  /**
   * Cảnh báo sắp hết hàng hoặc hết hàng
   */
  async getLowStockAlerts(threshold = 10): Promise<ApiEnvelope<LowStockAlertDto[]>> {
    try {
      const res = await apiClient.get<ApiEnvelope<LowStockAlertDto[]>>('/admin/inventory/alerts', {
        params: { threshold },
      });
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => {
        const alerts = mockVariants
          .filter((v) => v.availableQuantity <= threshold)
          .map((v) => ({
            variantId: v.variantId,
            sku: v.sku,
            productName: v.productName,
            variantName: v.variantName,
            thumbnailUrl: v.thumbnailUrl,
            onHandQuantity: v.onHandQuantity,
            reservedQuantity: v.reservedQuantity,
            availableQuantity: v.availableQuantity,
            lowStockThreshold: threshold,
            status: v.availableQuantity === 0 ? 'Hết hàng' : 'Sắp hết hàng',
          }));
        return { isSuccess: true, data: alerts, message: 'Lấy cảnh báo tồn kho thành công.' };
      });
    }
  },

  /**
   * Sổ cái lịch sử biến động kho (StockMovement)
   */
  async getMovements(filter: StockMovementQueryFilter = {}): Promise<ApiEnvelope<StockMovementDto[]>> {
    try {
      const res = await apiClient.get<ApiEnvelope<StockMovementDto[]>>('/admin/inventory/movements', {
        params: filter,
      });
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => {
        let filtered = [...mockMovements];
        if (filter.variantId) {
          filtered = filtered.filter((m) => m.variantId === filter.variantId);
        }
        if (filter.type) {
          filtered = filtered.filter((m) => m.type === filter.type);
        }
        return { isSuccess: true, data: filtered, message: 'Lấy sổ cái biến động thành công.' };
      });
    }
  },

  // --- SUPPLIERS ---

  async getSuppliers(search?: string, isActive?: boolean): Promise<ApiEnvelope<SupplierDto[]>> {
    try {
      const res = await apiClient.get<ApiEnvelope<SupplierDto[]>>('/admin/purchasing/suppliers', {
        params: { search, isActive },
      });
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => {
        let filtered = [...mockSuppliers];
        if (isActive !== undefined) {
          filtered = filtered.filter((s) => s.isActive === isActive);
        }
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
        }
        return { isSuccess: true, data: filtered, message: 'Lấy danh sách NCC thành công.' };
      });
    }
  },

  async createSupplier(dto: CreateSupplierDto): Promise<ApiEnvelope<SupplierDto>> {
    try {
      const res = await apiClient.post<ApiEnvelope<SupplierDto>>('/admin/purchasing/suppliers', dto);
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => {
        const newSup: SupplierDto = {
          id: `sup-${Date.now()}`,
          code: dto.code.toUpperCase(),
          name: dto.name,
          contactPerson: dto.contactPerson,
          phone: dto.phone,
          email: dto.email,
          address: dto.address,
          isActive: true,
          notes: dto.notes,
          createdAt: new Date().toISOString(),
        };
        mockSuppliers.push(newSup);
        return { isSuccess: true, data: newSup, message: 'Tạo nhà cung cấp thành công.' };
      });
    }
  },

  async updateSupplier(id: string, dto: UpdateSupplierDto): Promise<ApiEnvelope<SupplierDto>> {
    try {
      const res = await apiClient.put<ApiEnvelope<SupplierDto>>(`/admin/purchasing/suppliers/${id}`, dto);
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => {
        const sup = mockSuppliers.find((s) => s.id === id);
        if (sup) {
          Object.assign(sup, dto, { updatedAt: new Date().toISOString() });
          return { isSuccess: true, data: sup, message: 'Cập nhật nhà cung cấp thành công.' };
        }
        return { isSuccess: false, error: 'Không tìm thấy nhà cung cấp.' };
      });
    }
  },

  // --- PURCHASE ORDERS ---

  async getPurchaseOrders(filter: PurchaseOrderQueryFilter = {}): Promise<ApiEnvelope<PurchaseOrderDto[]>> {
    try {
      const res = await apiClient.get<ApiEnvelope<PurchaseOrderDto[]>>('/admin/purchasing/purchase-orders', {
        params: filter,
      });
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => {
        let filtered = [...mockPurchaseOrders];
        if (filter.supplierId) {
          filtered = filtered.filter((po) => po.supplierId === filter.supplierId);
        }
        if (filter.status) {
          filtered = filtered.filter((po) => po.status === filter.status);
        }
        return { isSuccess: true, data: filtered, message: 'Lấy danh sách phiếu nhập thành công.' };
      });
    }
  },

  async createPurchaseOrder(dto: CreatePurchaseOrderDto): Promise<ApiEnvelope<PurchaseOrderDto>> {
    try {
      const res = await apiClient.post<ApiEnvelope<PurchaseOrderDto>>('/admin/purchasing/purchase-orders', dto);
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => {
        const supplier = mockSuppliers.find((s) => s.id === dto.supplierId);
        const code = dto.code || `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

        let totalAmount = 0;
        const items = dto.items.map((i, idx) => {
          const variant = mockVariants.find((v) => v.variantId === i.variantId);
          const total = i.quantity * i.unitCost;
          totalAmount += total;
          return {
            id: `poi-${Date.now()}-${idx}`,
            purchaseOrderId: `po-${Date.now()}`,
            variantId: i.variantId,
            variantSku: variant?.sku,
            variantName: variant?.variantName,
            productName: variant?.productName,
            quantity: i.quantity,
            unitCost: i.unitCost,
            totalCost: total,
            notes: i.notes,
          };
        });

        const newPo: PurchaseOrderDto = {
          id: `po-${Date.now()}`,
          code,
          supplierId: dto.supplierId,
          supplierName: supplier?.name || 'Nhà cung cấp',
          status: PurchaseOrderStatus.Draft,
          totalAmount,
          notes: dto.notes,
          createdBy: 'admin@madkstore.vn',
          receivedAt: null,
          createdAt: new Date().toISOString(),
          items,
        };

        mockPurchaseOrders.unshift(newPo);
        return { isSuccess: true, data: newPo, message: 'Tạo phiếu nhập hàng thành công.' };
      });
    }
  },

  async receivePurchaseOrder(id: string): Promise<ApiEnvelope<PurchaseOrderDto>> {
    try {
      const res = await apiClient.post<ApiEnvelope<PurchaseOrderDto>>(
        `/admin/purchasing/purchase-orders/${id}/receive`
      );
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => {
        const po = mockPurchaseOrders.find((p) => p.id === id);
        if (!po) {
          return { isSuccess: false, error: 'Không tìm thấy phiếu nhập hàng.' };
        }
        if (po.status === PurchaseOrderStatus.Received) {
          return { isSuccess: false, error: 'Phiếu nhập này đã nhận hàng trước đó.' };
        }

        // Tăng tồn kho và cập nhật giá vốn
        for (const item of po.items) {
          const variant = mockVariants.find((v) => v.variantId === item.variantId);
          if (variant) {
            variant.onHandQuantity += item.quantity;
            variant.availableQuantity += item.quantity;
            variant.costPrice = item.unitCost;
            variant.updatedAt = new Date().toISOString();

            mockMovements.unshift({
              id: `mov-${Date.now()}-${item.variantId}`,
              variantId: item.variantId,
              type: StockMovementType.Restock,
              quantity: item.quantity,
              onHandBefore: variant.onHandQuantity - item.quantity,
              onHandAfter: variant.onHandQuantity,
              reservedBefore: variant.reservedQuantity,
              reservedAfter: variant.reservedQuantity,
              referenceType: 'PurchaseOrder',
              referenceId: po.code,
              reason: `Nhập hàng theo phiếu ${po.code}`,
              createdAt: new Date().toISOString(),
            });
          }
        }

        po.status = PurchaseOrderStatus.Received;
        po.receivedAt = new Date().toISOString();

        return { isSuccess: true, data: po, message: 'Hoàn tất nhập hàng vào kho thành công.' };
      });
    }
  },

  // --- INVENTORY AUDITS ---

  async getAudits(): Promise<ApiEnvelope<InventoryAuditDto[]>> {
    try {
      const res = await apiClient.get<ApiEnvelope<InventoryAuditDto[]>>('/admin/purchasing/audits');
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => ({
        isSuccess: true,
        data: mockAudits,
        message: 'Lấy danh sách phiếu kiểm kê thành công.',
      }));
    }
  },

  async createAudit(dto: CreateInventoryAuditDto): Promise<ApiEnvelope<InventoryAuditDto>> {
    try {
      const res = await apiClient.post<ApiEnvelope<InventoryAuditDto>>('/admin/purchasing/audits', dto);
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => {
        const code = dto.code || `AUD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

        const items = dto.items.map((i, idx) => {
          const variant = mockVariants.find((v) => v.variantId === i.variantId);
          const systemQuantity = variant?.onHandQuantity || 0;
          const actualQuantity = i.actualQuantity ?? systemQuantity;
          return {
            id: `ai-${Date.now()}-${idx}`,
            inventoryAuditId: `aud-${Date.now()}`,
            variantId: i.variantId,
            variantSku: variant?.sku,
            variantName: variant?.variantName,
            productName: variant?.productName,
            systemQuantity,
            actualQuantity,
            discrepancy: actualQuantity - systemQuantity,
            reason: i.reason,
          };
        });

        const newAudit: InventoryAuditDto = {
          id: `aud-${Date.now()}`,
          code,
          status: InventoryAuditStatus.Draft,
          notes: dto.notes,
          createdBy: 'admin@madkstore.vn',
          completedAt: null,
          createdAt: new Date().toISOString(),
          items,
        };

        mockAudits.unshift(newAudit);
        return { isSuccess: true, data: newAudit, message: 'Tạo phiếu kiểm kê thành công.' };
      });
    }
  },

  async completeAudit(id: string, dto: CompleteInventoryAuditDto): Promise<ApiEnvelope<InventoryAuditDto>> {
    try {
      const res = await apiClient.post<ApiEnvelope<InventoryAuditDto>>(
        `/admin/purchasing/audits/${id}/complete`,
        dto
      );
      return res.data;
    } catch (err: unknown) {
      return handleApiError(err, () => {
        const audit = mockAudits.find((a) => a.id === id);
        if (!audit) {
          return { isSuccess: false, error: 'Không tìm thấy phiếu kiểm kê.' };
        }

        // Cập nhật actualQuantity nếu có
        if (dto.items) {
          for (const item of dto.items) {
            const target = audit.items.find((i) => i.variantId === item.variantId);
            if (target) {
              target.actualQuantity = item.actualQuantity;
              target.discrepancy = target.actualQuantity - target.systemQuantity;
              if (item.reason) target.reason = item.reason;
            }
          }
        }

        // Cân bằng tồn kho qua điều chỉnh
        for (const item of audit.items) {
          if (item.discrepancy !== 0) {
            const variant = mockVariants.find((v) => v.variantId === item.variantId);
            if (variant) {
              const onHandBefore = variant.onHandQuantity;
              variant.onHandQuantity += item.discrepancy;
              variant.availableQuantity = Math.max(0, variant.onHandQuantity - variant.reservedQuantity);
              variant.updatedAt = new Date().toISOString();

              mockMovements.unshift({
                id: `mov-${Date.now()}-${item.variantId}`,
                variantId: item.variantId,
                type: StockMovementType.Adjustment,
                quantity: Math.abs(item.discrepancy),
                onHandBefore,
                onHandAfter: variant.onHandQuantity,
                reservedBefore: variant.reservedQuantity,
                reservedAfter: variant.reservedQuantity,
                referenceType: 'InventoryAudit',
                referenceId: audit.code,
                reason: `Cân bằng kiểm kho ${audit.code}: ${item.discrepancy > 0 ? '+' : ''}${item.discrepancy} (${item.reason || 'Kiểm kê định kỳ'})`,
                createdAt: new Date().toISOString(),
              });
            }
          }
        }

        audit.status = InventoryAuditStatus.Completed;
        audit.completedAt = new Date().toISOString();

        return { isSuccess: true, data: audit, message: 'Đã hoàn tất kiểm kê và cân bằng kho.' };
      });
    }
  },
};
