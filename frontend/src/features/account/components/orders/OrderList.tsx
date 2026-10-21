import React, { useState, useEffect, useCallback } from 'react';
import { OrderDto, OrderStatus } from '../../../../types/order';
import orderApi from '../../../../api/orderApi';
import { OrderCard } from './OrderCard';
import { OrderDetailModal } from './OrderDetailModal';
import { CancelOrderModal } from './CancelOrderModal';
import { ReturnRequestModal } from './ReturnRequestModal';
import { ReturnRequestDto } from '../../../../types/return';

interface TabFilter {
  id: 'ALL' | OrderStatus;
  label: string;
  icon: string;
}

const TABS: TabFilter[] = [
  { id: 'ALL', label: 'Tất cả', icon: '📋' },
  { id: 'Pending', label: 'Chờ xác nhận', icon: '⏳' },
  { id: 'Confirmed', label: 'Đã xác nhận', icon: '✓' },
  { id: 'Processing', label: 'Đang xử lý', icon: '📦' },
  { id: 'Shipping', label: 'Đang giao', icon: '🚚' },
  { id: 'Completed', label: 'Hoàn tất', icon: '🎉' },
  { id: 'Cancelled', label: 'Đã hủy', icon: '✕' },
  { id: 'ReturnRequested', label: 'Đang đổi trả', icon: '↩️' },
  { id: 'Returned', label: 'Đã hoàn trả', icon: '💸' },
];

export const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | OrderStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<OrderDto | null>(null);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<OrderDto | null>(null);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<OrderDto | null>(null);
  const [returnsRefreshKey, setReturnsRefreshKey] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const filterStatus = activeTab === 'ALL' ? undefined : activeTab;
    const res = await orderApi.getMyOrders(filterStatus);

    setIsLoading(false);
    if (res.isSuccess && res.data) {
      setOrders(res.data);
    } else {
      setError(res.error || 'Không thể tải danh sách đơn hàng.');
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOrderCancelled = (updatedOrder: OrderDto) => {
    // Cập nhật lại đơn trong danh sách
    setOrders((prev) =>
      prev.map((o) => (o.orderNumber === updatedOrder.orderNumber ? updatedOrder : o))
    );

    // Cập nhật modal chi tiết nếu đang mở
    if (selectedOrderForDetail?.orderNumber === updatedOrder.orderNumber) {
      setSelectedOrderForDetail(updatedOrder);
    }

    setToastMessage(`Đơn hàng #${updatedOrder.orderNumber} đã được hủy thành công và hoàn trả tồn kho.`);
    setTimeout(() => setToastMessage(null), 6000);
  };

  const handleReturnCreated = (request: ReturnRequestDto) => {
    // Backend chuyển đơn Completed -> ReturnRequested khi tạo yêu cầu thành công
    const patch = (o: OrderDto): OrderDto =>
      o.orderNumber === request.orderNumber ? { ...o, status: 'ReturnRequested' } : o;

    setOrders((prev) => prev.map(patch));
    setSelectedOrderForDetail((prev) => (prev ? patch(prev) : prev));
    setSelectedOrderForReturn(null);
    setReturnsRefreshKey((k) => k + 1);

    setToastMessage(
      `Đã gửi yêu cầu đổi trả cho đơn #${request.orderNumber}. Nhân viên sẽ liên hệ bạn trong vòng 24 giờ.`
    );
    setTimeout(() => setToastMessage(null), 6000);
  };

  // Lọc theo search input client
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const matchNumber = o.orderNumber.toLowerCase().includes(q);
    const matchItem = o.items.some(
      (i) =>
        i.productNameSnapshot.toLowerCase().includes(q) ||
        i.variantNameSnapshot.toLowerCase().includes(q) ||
        i.skuSnapshot.toLowerCase().includes(q)
    );
    return matchNumber || matchItem;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-base">✅</span>
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs text-emerald-700 font-bold hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Filter Tabs Header */}
      <div className="bg-white rounded-3xl p-3 border border-slate-200/90 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and stats bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn (MK-...), tên bàn phím, SKU..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-white"
          />
          <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">🔍</span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="text-xs font-semibold text-slate-500 flex items-center gap-2 self-end sm:self-center">
          <span>Tìm thấy:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold font-mono">
            {filteredOrders.length} đơn
          </span>
          <button
            type="button"
            onClick={fetchOrders}
            className="ml-2 text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
            title="Làm mới danh sách"
          >
            <span>🔄</span> Làm mới
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="h-4 bg-slate-200 rounded-md w-32"></div>
                <div className="h-5 bg-slate-200 rounded-full w-24"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-3.5 bg-slate-200 rounded-md w-48"></div>
                  <div className="h-3 bg-slate-200 rounded-md w-24"></div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <div className="h-4 bg-slate-200 rounded-md w-28"></div>
                <div className="h-8 bg-slate-200 rounded-xl w-24"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center text-xl font-bold">
            ⚠️
          </div>
          <h3 className="text-sm font-bold text-slate-900">Không thể tải dữ liệu đơn hàng</h3>
          <p className="text-xs text-rose-600 max-w-md mx-auto">{error}</p>
          <button
            type="button"
            onClick={fetchOrders}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredOrders.length === 0 && (
        <div className="bg-white rounded-3xl p-10 border border-slate-200/90 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center text-3xl">
            📦
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {searchQuery ? 'Không tìm thấy đơn hàng phù hợp' : 'Chưa có đơn hàng nào'}
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác.'
                : 'Khám phá ngay các mẫu bàn phím cơ cao cấp Keychron, MonsGeek, FL-Esports và đặt hàng trải nghiệm ngay.'}
            </p>
          </div>
          {!searchQuery && (
            <a
              href="/catalog"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-600/20 transition-all"
            >
              <span>🛒</span>
              <span>Khám phá sản phẩm ngay</span>
            </a>
          )}
        </div>
      )}

      {/* Orders List Grid */}
      {!isLoading && !error && filteredOrders.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onViewDetails={(o) => setSelectedOrderForDetail(o)}
              onRequestCancel={(o) => setSelectedOrderForCancel(o)}
              onRequestReturn={(o) => setSelectedOrderForReturn(o)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedOrderForDetail && (
        <OrderDetailModal
          order={selectedOrderForDetail}
          isOpen={!!selectedOrderForDetail}
          onClose={() => setSelectedOrderForDetail(null)}
          onRequestCancel={(o) => {
            setSelectedOrderForCancel(o);
          }}
          onRequestReturn={(o) => setSelectedOrderForReturn(o)}
          returnsRefreshKey={returnsRefreshKey}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {selectedOrderForCancel && (
        <CancelOrderModal
          order={selectedOrderForCancel}
          isOpen={!!selectedOrderForCancel}
          onClose={() => setSelectedOrderForCancel(null)}
          onCancelled={handleOrderCancelled}
        />
      )}

      {/* Return Request Modal */}
      {selectedOrderForReturn && (
        <ReturnRequestModal
          key={selectedOrderForReturn.orderNumber}
          order={selectedOrderForReturn}
          isOpen={!!selectedOrderForReturn}
          onClose={() => setSelectedOrderForReturn(null)}
          onCreated={handleReturnCreated}
        />
      )}
    </div>
  );
};

export default OrderList;
