import apiClient from './apiClient';
import { ApiEnvelope } from '../types/auth';
import { adminInventoryApi } from './adminInventoryApi';
import { VariantInventoryItemDto } from '../types/inventory';
import { OrderDto } from '../types/order';

export interface DailyOrderStat {
  date: string;
  orderCount: number;
  revenue: number;
  grossProfit: number;
}

export interface TopSellingProduct {
  productId?: string | null;
  variantId?: string | null;
  productName: string;
  variantName: string;
  sku: string;
  thumbnailUrl?: string | null;
  quantitySold: number;
  revenue: number;
  grossProfit: number;
}

export interface LowStockItem {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  thumbnailUrl?: string | null;
  onHand: number;
  reserved: number;
  available: number;
  threshold: number;
}

export interface RevenueReport {
  totalRevenue: number;
  grossProfit: number;
  grossMarginPercentage: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  dailyStats: DailyOrderStat[];
  topProducts: TopSellingProduct[];
}

export interface InventoryReport {
  totalSkus: number;
  totalOnHand: number;
  totalReserved: number;
  availableStock: number;
  lowStockSkuCount: number;
  lowStockItems: LowStockItem[];
}

export interface DashboardSummary {
  revenue?: RevenueReport | null;
  inventory?: InventoryReport | null;
  totalUsers: number;
  totalProducts: number;
  totalAuditLogs: number;
  role: string;
}

const ADMIN_ORDERS_KEY = 'madk_admin_orders_store';

/**
 * Helper to compute mock revenue report from localStorage orders & inventory cost prices
 */
async function computeMockRevenueReport(fromDate?: string, toDate?: string): Promise<RevenueReport> {
  let orders: OrderDto[] = [];
  try {
    const raw = localStorage.getItem(ADMIN_ORDERS_KEY);
    if (raw) {
      orders = JSON.parse(raw);
    }
  } catch {
    orders = [];
  }

  // Get current inventory variants to lookup accurate cost prices
  const variantRes = await adminInventoryApi.getVariantInventories();
  const variants: VariantInventoryItemDto[] = variantRes.data || [];
  const costMap = new Map<string, number>();
  for (const v of variants) {
    if (v.sku) costMap.set(v.sku, v.costPrice || v.salePrice * 0.7);
    if (v.variantId) costMap.set(v.variantId, v.costPrice || v.salePrice * 0.7);
  }

  let filtered = orders;
  if (fromDate) {
    const fromTime = new Date(fromDate).getTime();
    filtered = filtered.filter((o) => new Date(o.createdAt).getTime() >= fromTime);
  }
  if (toDate) {
    const toTime = new Date(toDate).getTime();
    filtered = filtered.filter((o) => new Date(o.createdAt).getTime() <= toTime);
  }

  const totalOrders = filtered.length;
  const completedOrders = filtered.filter((o) => o.status === 'Completed').length;
  const cancelledOrders = filtered.filter((o) => o.status === 'Cancelled').length;

  const qualifyingOrders = filtered.filter((o) => o.status === 'Completed' || o.status === 'Shipping');
  const totalRevenue = qualifyingOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Group top selling products and calculate COGS & gross profit
  const productAggregates = new Map<
    string,
    {
      productId?: string | null;
      variantId?: string | null;
      productName: string;
      variantName: string;
      sku: string;
      thumbnailUrl?: string | null;
      quantitySold: number;
      revenue: number;
      totalCost: number;
    }
  >();

  let totalCOGS = 0;
  const orderProfits = new Map<string, number>();

  for (const ord of qualifyingOrders) {
    let orderProfit = 0;
    for (const item of ord.items || []) {
      const unitPrice = item.unitPriceSnapshot || 0;
      const unitCost: number =
        (item.skuSnapshot && costMap.has(item.skuSnapshot) ? costMap.get(item.skuSnapshot)! : null) ??
        (item.variantId && costMap.has(item.variantId) ? costMap.get(item.variantId)! : null) ??
        (unitPrice * 0.7);

      const itemCost: number = item.quantity * unitCost;
      const itemRev: number = item.totalPrice ?? (item.quantity * unitPrice);
      const itemGrossProfit: number = itemRev - itemCost;

      totalCOGS += itemCost;
      orderProfit += itemGrossProfit;

      const key = item.skuSnapshot || item.variantId || item.productNameSnapshot;
      const existing = productAggregates.get(key) || {
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productNameSnapshot,
        variantName: item.variantNameSnapshot,
        sku: item.skuSnapshot,
        thumbnailUrl: item.thumbnailUrlSnapshot,
        quantitySold: 0,
        revenue: 0,
        totalCost: 0,
      };

      existing.quantitySold += item.quantity;
      existing.revenue += itemRev;
      existing.totalCost += itemCost;
      productAggregates.set(key, existing);
    }
    orderProfits.set(ord.id, orderProfit);
  }

  const grossProfit = totalRevenue - totalCOGS;
  const grossMarginPercentage = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 10000) / 100 : 0;
  const averageOrderValue =
    completedOrders > 0
      ? Math.round(totalRevenue / completedOrders)
      : totalOrders > 0
        ? Math.round(totalRevenue / totalOrders)
        : 0;

  // Group daily stats
  const dailyMap = new Map<string, { count: number; rev: number; profit: number }>();
  for (const ord of filtered) {
    const day = ord.createdAt.split('T')[0];
    const existing = dailyMap.get(day) || { count: 0, rev: 0, profit: 0 };
    existing.count += 1;
    if (ord.status === 'Completed' || ord.status === 'Shipping') {
      existing.rev += ord.totalAmount;
      existing.profit += orderProfits.get(ord.id) || 0;
    }
    dailyMap.set(day, existing);
  }

  // Ensure last 7 days are represented if dailyMap has few days
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dayStr = d.toISOString().split('T')[0];
    if (!dailyMap.has(dayStr)) {
      dailyMap.set(dayStr, { count: 0, rev: 0, profit: 0 });
    }
  }

  const dailyStats: DailyOrderStat[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, val]) => ({
      date,
      orderCount: val.count,
      revenue: val.rev,
      grossProfit: val.profit,
    }));

  const topProducts: TopSellingProduct[] = Array.from(productAggregates.values())
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 10)
    .map((p) => ({
      productId: p.productId,
      variantId: p.variantId,
      productName: p.productName,
      variantName: p.variantName,
      sku: p.sku,
      thumbnailUrl: p.thumbnailUrl,
      quantitySold: p.quantitySold,
      revenue: p.revenue,
      grossProfit: p.revenue - p.totalCost,
    }));

  return {
    totalRevenue,
    grossProfit,
    grossMarginPercentage,
    totalOrders,
    completedOrders,
    cancelledOrders,
    averageOrderValue,
    dailyStats,
    topProducts,
  };
}

/**
 * Helper to compute mock inventory report from variant items
 */
async function computeMockInventoryReport(threshold = 10): Promise<InventoryReport> {
  const variantRes = await adminInventoryApi.getVariantInventories();
  const variants: VariantInventoryItemDto[] = variantRes.data || [];

  const totalSkus = variants.length;
  const totalOnHand = variants.reduce((sum: number, v: VariantInventoryItemDto) => sum + v.onHandQuantity, 0);
  const totalReserved = variants.reduce((sum: number, v: VariantInventoryItemDto) => sum + v.reservedQuantity, 0);
  const availableStock = Math.max(0, totalOnHand - totalReserved);

  const lowStockVariants = variants
    .filter((v: VariantInventoryItemDto) => v.availableQuantity <= threshold)
    .sort((a: VariantInventoryItemDto, b: VariantInventoryItemDto) => a.availableQuantity - b.availableQuantity);

  const lowStockItems: LowStockItem[] = lowStockVariants.map((v: VariantInventoryItemDto) => ({
    variantId: v.variantId,
    sku: v.sku,
    productName: v.productName,
    variantName: v.variantName,
    thumbnailUrl: v.thumbnailUrl,
    onHand: v.onHandQuantity,
    reserved: v.reservedQuantity,
    available: v.availableQuantity,
    threshold,
  }));

  return {
    totalSkus,
    totalOnHand,
    totalReserved,
    availableStock,
    lowStockSkuCount: lowStockItems.length,
    lowStockItems,
  };
}

export const adminDashboardApi = {
  /**
   * Lấy báo cáo tổng hợp Dashboard điều hành theo quyền của tài khoản:
   * - Sales: Thống kê doanh thu, lợi nhuận gộp, đơn theo ngày, top bán chạy. (Inventory = null)
   * - Warehouse: Tồn kho, cảnh báo sắp hết hàng. (Revenue = null)
   * - Admin: Toàn bộ chỉ số doanh thu, tồn kho và số liệu hệ thống.
   */
  getDashboardSummary: async (role = 'Admin'): Promise<DashboardSummary> => {
    try {
      const response = await apiClient.get<ApiEnvelope<DashboardSummary>>('/admin/reports/dashboard');
      if (response.data?.isSuccess && response.data.data) {
        return response.data.data;
      }
    } catch (err) {
      console.warn('Backend API /admin/reports/dashboard unavailable, using dynamic synchronized mock:', err);
    }

    // Dynamic mock fallback honoring role visibility matrix
    const isSales = role === 'Sales';
    const isWarehouse = role === 'Warehouse';
    const isAdmin = role === 'Admin' || (!isSales && !isWarehouse);

    const revenue = isAdmin || isSales ? await computeMockRevenueReport() : null;
    const inventory = isAdmin || isWarehouse ? await computeMockInventoryReport(10) : null;

    return {
      revenue,
      inventory,
      totalUsers: isAdmin ? 42 : 0,
      totalProducts: isAdmin ? 28 : 0,
      totalAuditLogs: isAdmin ? 156 : 0,
      role,
    };
  },

  /**
   * Lấy báo cáo doanh thu độc lập (Quyền: report.revenue)
   */
  getRevenueReport: async (fromDate?: string, toDate?: string): Promise<RevenueReport> => {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const response = await apiClient.get<ApiEnvelope<RevenueReport>>(
        `/admin/reports/revenue?${params.toString()}`
      );
      if (response.data?.isSuccess && response.data.data) {
        return response.data.data;
      }
    } catch (err) {
      console.warn('Backend API /admin/reports/revenue unavailable, using dynamic mock:', err);
    }

    return computeMockRevenueReport(fromDate, toDate);
  },

  /**
   * Lấy báo cáo tồn kho & cảnh báo sắp hết hàng (Quyền: report.inventory)
   */
  getInventoryReport: async (threshold = 10): Promise<InventoryReport> => {
    try {
      const response = await apiClient.get<ApiEnvelope<InventoryReport>>(
        `/admin/reports/inventory?threshold=${threshold}`
      );
      if (response.data?.isSuccess && response.data.data) {
        return response.data.data;
      }
    } catch (err) {
      console.warn('Backend API /admin/reports/inventory unavailable, using dynamic mock:', err);
    }

    return computeMockInventoryReport(threshold);
  },
};

export default adminDashboardApi;
