export enum StockMovementType {
  Restock = 1,
  Reserve = 2,
  Release = 3,
  Commit = 4,
  Adjustment = 5,
}

export interface InventoryDto {
  id: string;
  variantId: string;
  onHandQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  updatedAt?: string | null;
}

export interface StockMovementDto {
  id: string;
  variantId: string;
  type: StockMovementType;
  quantity: number;
  onHandBefore: number;
  onHandAfter: number;
  reservedBefore: number;
  reservedAfter: number;
  referenceType?: string | null;
  referenceId?: string | null;
  reason?: string | null;
  createdAt: string;
}

export interface AdjustStockRequestDto {
  variantId: string;
  quantityChange: number;
  reason: string;
  referenceType?: string | null;
  referenceId?: string | null;
}

export interface VariantInventoryItemDto {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  categoryName?: string | null;
  brandName?: string | null;
  thumbnailUrl?: string | null;
  costPrice: number;
  salePrice: number;
  onHandQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  updatedAt?: string | null;
}

export interface LowStockAlertDto {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  thumbnailUrl?: string | null;
  onHandQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  status: string;
}

export interface StockMovementQueryFilter {
  variantId?: string;
  type?: StockMovementType;
  referenceType?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

// Suppliers
export interface SupplierDto {
  id: string;
  code: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateSupplierDto {
  code: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface UpdateSupplierDto {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  notes?: string;
}

// Purchase Orders
export enum PurchaseOrderStatus {
  Draft = 1,
  Received = 2,
  Cancelled = 3,
}

export interface PurchaseOrderItemDto {
  id: string;
  purchaseOrderId: string;
  variantId: string;
  variantSku?: string | null;
  variantName?: string | null;
  productName?: string | null;
  quantity: number;
  unitCost: number;
  totalCost: number;
  notes?: string | null;
}

export interface PurchaseOrderDto {
  id: string;
  code: string;
  supplierId: string;
  supplierName?: string | null;
  status: PurchaseOrderStatus;
  totalAmount: number;
  notes?: string | null;
  createdBy?: string | null;
  receivedAt?: string | null;
  createdAt: string;
  items: PurchaseOrderItemDto[];
}

export interface CreatePurchaseOrderItemDto {
  variantId: string;
  quantity: number;
  unitCost: number;
  notes?: string;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  code?: string;
  notes?: string;
  items: CreatePurchaseOrderItemDto[];
}

export interface PurchaseOrderQueryFilter {
  supplierId?: string;
  status?: PurchaseOrderStatus;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

// Inventory Audits
export enum InventoryAuditStatus {
  Draft = 1,
  Completed = 2,
  Cancelled = 3,
}

export interface InventoryAuditItemDto {
  id: string;
  inventoryAuditId: string;
  variantId: string;
  variantSku?: string | null;
  variantName?: string | null;
  productName?: string | null;
  systemQuantity: number;
  actualQuantity: number;
  discrepancy: number;
  reason?: string | null;
}

export interface InventoryAuditDto {
  id: string;
  code: string;
  status: InventoryAuditStatus;
  notes?: string | null;
  createdBy?: string | null;
  completedAt?: string | null;
  createdAt: string;
  items: InventoryAuditItemDto[];
}

export interface CreateInventoryAuditItemDto {
  variantId: string;
  actualQuantity?: number;
  reason?: string;
}

export interface CreateInventoryAuditDto {
  code?: string;
  notes?: string;
  items: CreateInventoryAuditItemDto[];
}

export interface CompleteInventoryAuditItemDto {
  variantId: string;
  actualQuantity: number;
  reason?: string;
}

export interface CompleteInventoryAuditDto {
  items?: CompleteInventoryAuditItemDto[];
}
