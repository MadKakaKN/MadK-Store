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

// Mock in-memory store for standalone frontend demo & testing
let mockVariants: VariantInventoryItemDto[] = [
  {
    variantId: 'v-001',
    productId: 'p-001',
    productName: 'Bàn phím cơ MadK Cyber 87',
    variantName: 'Gateron Yellow Switch / Đen',
    sku: 'MK-CYBER-87-YEL',
    categoryName: 'Bàn phím cơ',
    brandName: 'MadK Gaming',
    thumbnailUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=300',
    costPrice: 1200000,
    salePrice: 1690000,
    onHandQuantity: 35,
    reservedQuantity: 5,
    availableQuantity: 30,
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    variantId: 'v-002',
    productId: 'p-001',
    productName: 'Bàn phím cơ MadK Cyber 87',
    variantName: 'Gateron Red Switch / Trắng',
    sku: 'MK-CYBER-87-RED',
    categoryName: 'Bàn phím cơ',
    brandName: 'MadK Gaming',
    thumbnailUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=300',
    costPrice: 1200000,
    salePrice: 1750000,
    onHandQuantity: 4,
    reservedQuantity: 1,
    availableQuantity: 3,
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    variantId: 'v-003',
    productId: 'p-002',
    productName: 'Chuột gaming không dây MadK Air 58',
    variantName: 'Trắng Feather Light',
    sku: 'MK-AIR58-WHT',
    categoryName: 'Chuột gaming',
    brandName: 'MadK Gaming',
    thumbnailUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=300',
    costPrice: 750000,
    salePrice: 1190000,
    onHandQuantity: 0,
    reservedQuantity: 0,
    availableQuantity: 0,
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    variantId: 'v-004',
    productId: 'p-003',
    productName: 'Tai nghe chụp tai MadK Studio Pro Wireless',
    variantName: 'Đen Obsidian / ANC',
    sku: 'MK-STUDIO-PRO-BLK',
    categoryName: 'Tai nghe',
    brandName: 'MadK Audio',
    thumbnailUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
    costPrice: 1600000,
    salePrice: 2490000,
    onHandQuantity: 18,
    reservedQuantity: 4,
    availableQuantity: 14,
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

let mockSuppliers: SupplierDto[] = [
  {
    id: 'sup-001',
    code: 'SUP-ASIA-TECH',
    name: 'Công ty TNHH Phân phối Linh kiện Á Châu',
    contactPerson: 'Nguyễn Văn Minh',
    phone: '0988123456',
    email: 'minh.nguyen@asiatech.vn',
    address: 'Tầng 5, Tòa nhà Detech, Cầu Giấy, Hà Nội',
    isActive: true,
    notes: 'Nhà phân phối chính thức switch Gateron và linh kiện bàn phím',
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    updatedAt: null,
  },
  {
    id: 'sup-002',
    code: 'SUP-GLOBAL-GEAR',
    name: 'Tập đoàn Global Gaming Gear Việt Nam',
    contactPerson: 'Trần Thị Mai',
    phone: '0912345678',
    email: 'contact@globalgear.com',
    address: '120 Võ Văn Tần, Quận 3, TP. Hồ Chí Minh',
    isActive: true,
    notes: 'Cung cấp cảm biến chuột PAW3395 và linh kiện âm thanh cao cấp',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: null,
  },
];

let mockMovements: StockMovementDto[] = [
  {
    id: 'mov-001',
    variantId: 'v-001',
    type: StockMovementType.Restock,
    quantity: 20,
    onHandBefore: 15,
    onHandAfter: 35,
    reservedBefore: 5,
    reservedAfter: 5,
    referenceType: 'PurchaseOrder',
    referenceId: 'PO-20261015-0001',
    reason: 'Nhập hàng đợt 1 từ NCC Á Châu',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'mov-002',
    variantId: 'v-002',
    type: StockMovementType.Adjustment,
    quantity: 2,
    onHandBefore: 6,
    onHandAfter: 4,
    reservedBefore: 1,
    reservedAfter: 1,
    referenceType: 'StockAdjustment',
    referenceId: 'AUD-001',
    reason: 'Hàng lỗi vỡ khi bốc xếp',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'mov-003',
    variantId: 'v-004',
    type: StockMovementType.Reserve,
    quantity: 2,
    onHandBefore: 18,
    onHandAfter: 18,
    reservedBefore: 2,
    reservedAfter: 4,
    referenceType: 'Order',
    referenceId: 'ORD-20261015-8899',
    reason: 'Khách hàng đặt mua đơn hàng',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

let mockPurchaseOrders: PurchaseOrderDto[] = [
  {
    id: 'po-001',
    code: 'PO-20261015-0001',
    supplierId: 'sup-001',
    supplierName: 'Công ty TNHH Phân phối Linh kiện Á Châu',
    status: PurchaseOrderStatus.Received,
    totalAmount: 24000000,
    notes: 'Lô hàng switch bàn phím tháng 10',
    createdBy: 'admin@madkstore.vn',
    receivedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    items: [
      {
        id: 'poi-001',
        purchaseOrderId: 'po-001',
        variantId: 'v-001',
        variantSku: 'MK-CYBER-87-YEL',
        variantName: 'Gateron Yellow Switch / Đen',
        productName: 'Bàn phím cơ MadK Cyber 87',
        quantity: 20,
        unitCost: 1200000,
        totalCost: 24000000,
        notes: 'Chính hãng seal',
      },
    ],
  },
];

let mockAudits: InventoryAuditDto[] = [
  {
    id: 'aud-001',
    code: 'AUD-20261014-001',
    status: InventoryAuditStatus.Completed,
    notes: 'Kiểm kê kho định kỳ giữa tháng 10',
    createdBy: 'warehouse@madkstore.vn',
    completedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    items: [
      {
        id: 'ai-001',
        inventoryAuditId: 'aud-001',
        variantId: 'v-001',
        variantSku: 'MK-CYBER-87-YEL',
        variantName: 'Gateron Yellow Switch / Đen',
        productName: 'Bàn phím cơ MadK Cyber 87',
        systemQuantity: 35,
        actualQuantity: 35,
        discrepancy: 0,
        reason: 'Khớp số liệu',
      },
      {
        id: 'ai-002',
        inventoryAuditId: 'aud-001',
        variantId: 'v-002',
        variantSku: 'MK-CYBER-87-RED',
        variantName: 'Gateron Red Switch / Trắng',
        productName: 'Bàn phím cơ MadK Cyber 87',
        systemQuantity: 6,
        actualQuantity: 4,
        discrepancy: -2,
        reason: 'Hàng lỗi vỡ khi bốc xếp',
      },
    ],
  },
];

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
        return { isSuccess: true, data: filtered, message: 'Lấy danh sách tồn kho thành công (Mock).' };
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
          message: 'Nhập kho thành công (Mock).',
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
          message: 'Điều chỉnh tồn kho thành công (Mock).',
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
        return { isSuccess: true, data: alerts, message: 'Lấy cảnh báo tồn kho thành công (Mock).' };
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
        return { isSuccess: true, data: filtered, message: 'Lấy sổ cái biến động thành công (Mock).' };
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
        return { isSuccess: true, data: filtered, message: 'Lấy danh sách NCC thành công (Mock).' };
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
        return { isSuccess: true, data: newSup, message: 'Tạo nhà cung cấp thành công (Mock).' };
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
          return { isSuccess: true, data: sup, message: 'Cập nhật nhà cung cấp thành công (Mock).' };
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
        return { isSuccess: true, data: filtered, message: 'Lấy danh sách phiếu nhập thành công (Mock).' };
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
        return { isSuccess: true, data: newPo, message: 'Tạo phiếu nhập hàng thành công (Mock).' };
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

        return { isSuccess: true, data: po, message: 'Hoàn tất nhập hàng vào kho thành công (Mock).' };
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
        message: 'Lấy danh sách phiếu kiểm kê thành công (Mock).',
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
        return { isSuccess: true, data: newAudit, message: 'Tạo phiếu kiểm kê thành công (Mock).' };
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

        return { isSuccess: true, data: audit, message: 'Đã hoàn tất kiểm kê và cân bằng kho (Mock).' };
      });
    }
  },
};
