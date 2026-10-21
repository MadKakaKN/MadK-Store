import React, { useState } from 'react';
import {
  OrderDto,
  OrderStatus,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from '../../../types/order';
import { adminOrderApi } from '../../../api/adminOrderApi';
import { useAuth } from '../../auth/context/AuthContext';
import { useToast } from '../components/common/ToastContext';
import Badge, { BadgeVariant } from '../components/common/Badge';

interface OrderDetailModalProps {
  order: OrderDto | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: OrderDto) => void;
}

const BADGE_MAP: Record<OrderStatus, BadgeVariant> = {
  PendingPayment: 'warning',
  Pending: 'warning',
  Confirmed: 'info',
  Processing: 'primary',
  Shipping: 'purple',
  Completed: 'success',
  Cancelled: 'danger',
  ReturnRequested: 'warning',
  Returned: 'neutral',
};

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onOrderUpdated,
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const [adminNote, setAdminNote] = useState<string>(order?.adminNote || '');
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);

  // Transition modal state
  const [targetStatus, setTargetStatus] = useState<OrderStatus | null>(null);
  const [transitionReason, setTransitionReason] = useState<string>('');
  const [transitionNote, setTransitionNote] = useState<string>('');
  const [isSubmittingTransition, setIsSubmittingTransition] = useState<boolean>(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  // Update local note state when order changes
  React.useEffect(() => {
    if (order) {
      setAdminNote(order.adminNote || '');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  // Authorization matrix:
  // Role Admin & Sales can manage/update status & note
  // Role Warehouse can view order for packing/dispatching, but status changes are disabled
  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes('Admin');
  const isSales = userRoles.includes('Sales');
  const isWarehouse = userRoles.includes('Warehouse');
  const canManage = isAdmin || isSales || user?.permissions?.includes('order.manage');

  const currentStatusMeta = ORDER_STATUS_CONFIG[order.status] || {
    label: order.status,
    icon: '📦',
  };

  // Parse shipping address snapshot safely
  let addressObj: {
    recipientName?: string;
    phoneNumber?: string;
    fullAddress?: string;
    detailedAddress?: string;
    provinceName?: string;
    districtName?: string;
    wardName?: string;
  } = {};

  try {
    if (order.shippingAddressSnapshot) {
      addressObj = JSON.parse(order.shippingAddressSnapshot);
    }
  } catch {
    addressObj = { fullAddress: order.shippingAddressSnapshot };
  }

  const recipientName = addressObj.recipientName || order.customerEmail || 'Khách hàng';
  const recipientPhone = addressObj.phoneNumber || order.customerPhone || 'Chưa có SĐT';
  const fullAddress =
    addressObj.fullAddress ||
    [addressObj.detailedAddress, addressObj.wardName, addressObj.districtName, addressObj.provinceName]
      .filter(Boolean)
      .join(', ') ||
    order.shippingAddressSnapshot;

  const handleSaveAdminNote = async () => {
    if (!order) return;
    setIsSavingNote(true);
    try {
      const actorName = user?.fullName || user?.email || (isAdmin ? 'Admin' : 'Sales');
      const res = await adminOrderApi.updateOrderNote(order.orderNumber, adminNote, actorName);
      if (res.isSuccess && res.data) {
        onOrderUpdated(res.data);
        toast.success('Đã lưu ghi chú nội bộ thành công!', 'Ghi chú nội bộ');
      } else {
        toast.error(res.error || 'Không thể lưu ghi chú.', 'Lỗi');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi lưu ghi chú.', 'Lỗi');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleInitiateTransition = (nextStatus: OrderStatus) => {
    setTargetStatus(nextStatus);
    setTransitionReason('');
    setTransitionNote('');
    setIsConfirmOpen(true);
  };

  const handleConfirmTransition = async () => {
    if (!order || !targetStatus) return;

    if (targetStatus === 'Cancelled' && !transitionReason.trim()) {
      toast.warning('Vui lòng nhập lý do hủy đơn hàng.', 'Bắt buộc');
      return;
    }

    setIsSubmittingTransition(true);
    try {
      const actorName = user?.fullName || user?.email || (isAdmin ? 'Admin' : 'Sales');
      const res = await adminOrderApi.updateOrderStatus(
        order.orderNumber,
        {
          newStatus: targetStatus,
          reason: transitionReason.trim() || undefined,
          note: transitionNote.trim() || undefined,
        },
        actorName
      );

      if (res.isSuccess && res.data) {
        onOrderUpdated(res.data);
        toast.success(
          `Đơn hàng ${order.orderNumber} đã chuyển sang "${ORDER_STATUS_CONFIG[targetStatus]?.label || targetStatus}"`,
          'Cập nhật thành công'
        );
        setIsConfirmOpen(false);
      } else {
        toast.error(res.error || 'Không thể cập nhật trạng thái đơn.', 'Thất bại');
      }
    } catch {
      toast.error('Lỗi khi gọi API đổi trạng thái.', 'Lỗi');
    } finally {
      setIsSubmittingTransition(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentStatusMeta.icon}</span>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-900 font-mono tracking-tight">
                  {order.orderNumber}
                </h2>
                <Badge variant={BADGE_MAP[order.status] || 'neutral'} dot size="sm">
                  {currentStatusMeta.label}
                </Badge>
                {order.paymentStatus === 'Paid' ? (
                  <Badge variant="success" size="sm">
                    Đã thanh toán
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm">
                    Chưa thanh toán (COD)
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Đặt lúc: {new Date(order.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Warehouse Permission Notice */}
          {isWarehouse && !canManage && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
              <span className="text-lg shrink-0">📦</span>
              <div>
                <p className="font-semibold">Quyền hạn Nhân viên Kho (Warehouse)</p>
                <p className="mt-0.5 text-amber-800">
                  Bạn có quyền xem thông tin chi tiết đơn hàng, danh sách sản phẩm và địa chỉ để thực hiện đóng gói và bàn giao. Thao tác thay đổi trạng thái và ghi chú nội bộ chỉ dành cho vai trò <strong>Sales</strong> hoặc <strong>Admin</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Return Notice Banner */}
          {(order.status === 'ReturnRequested' || order.status === 'Returned') && (
            <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between gap-3 text-xs text-orange-950">
              <div className="flex items-center gap-2.5">
                <span className="text-xl shrink-0">↩️</span>
                <div>
                  <p className="font-bold text-orange-900">
                    {order.status === 'ReturnRequested' ? 'Đơn hàng đang có yêu cầu đổi trả' : 'Đơn hàng đã hoàn trả'}
                  </p>
                  <p className="text-orange-800 text-[11px] mt-0.5">
                    Quản lý chi tiết thẩm định sản phẩm, tình trạng kho và hoàn tiền tại mục Đổi trả.
                  </p>
                </div>
              </div>
              <a
                href={`/admin/returns?search=${encodeURIComponent(order.orderNumber)}`}
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-1 shadow-2xs"
              >
                <span>Xử lý đổi trả</span> <span>→</span>
              </a>
            </div>
          )}

          {/* Customer & Address Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Khách hàng & Giao hàng */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span>📍</span> Thông tin Người nhận & Giao hàng
              </h3>
              <div>
                <span className="text-slate-500">Người nhận:</span>{' '}
                <strong className="text-slate-800">{recipientName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Số điện thoại:</span>{' '}
                <strong className="text-slate-800 font-mono">{recipientPhone}</strong>
              </div>
              {order.customerEmail && (
                <div>
                  <span className="text-slate-500">Email khách:</span>{' '}
                  <span className="text-slate-700">{order.customerEmail}</span>
                </div>
              )}
              <div>
                <span className="text-slate-500">Địa chỉ giao:</span>{' '}
                <span className="text-slate-800 font-medium">{fullAddress}</span>
              </div>
              {order.customerNote && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Ghi chú từ khách:</span>
                  <p className="text-slate-700 italic bg-amber-50/60 p-2 rounded-lg border border-amber-100 mt-1">
                    "{order.customerNote}"
                  </p>
                </div>
              )}
            </div>

            {/* Box 2: Thanh toán & Ghi chú nội bộ */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between text-xs">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mb-2">
                  <span>💳</span> Thanh toán & Quản trị
                </h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phương thức:</span>
                    <span className="font-semibold text-slate-800">{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Trạng thái thanh toán:</span>
                    <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${PAYMENT_STATUS_CONFIG[order.paymentStatus]?.color || 'text-slate-700'}`}>
                      {PAYMENT_STATUS_CONFIG[order.paymentStatus]?.label || order.paymentStatus}
                    </span>
                  </div>
                  {order.cancelReason && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 mt-2">
                      <strong className="block">Lý do hủy đơn:</strong>
                      <span>{order.cancelReason}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Internal Note (Ghi chú nội bộ) */}
              <div className="mt-3 pt-3 border-t border-slate-200">
                <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                  <span>📝 Ghi chú nội bộ (Staff/Admin):</span>
                  {canManage && (
                    <button
                      type="button"
                      onClick={handleSaveAdminNote}
                      disabled={isSavingNote}
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 disabled:opacity-50"
                    >
                      {isSavingNote ? 'Đang lưu...' : 'Lưu ghi chú'}
                    </button>
                  )}
                </label>
                <textarea
                  rows={2}
                  disabled={!canManage}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={canManage ? 'Nhập ghi chú cho nhân viên khác hoặc kho...' : 'Không có ghi chú nội bộ'}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Order Items Table */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-2.5 flex items-center justify-between">
              <span>📦 Danh sách Sản phẩm ({order.items?.length || 0} món)</span>
              <span className="text-xs font-normal text-slate-500">Snapshot giá tại thời điểm đặt hàng</span>
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Sản phẩm</th>
                    <th className="py-2.5 px-3">Mã SKU</th>
                    <th className="py-2.5 px-3 text-right">Đơn giá</th>
                    <th className="py-2.5 px-3 text-center">Số lượng</th>
                    <th className="py-2.5 px-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          {item.thumbnailUrlSnapshot && (
                            <img
                              src={item.thumbnailUrlSnapshot}
                              alt={item.productNameSnapshot}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                            />
                          )}
                          <div>
                            <div className="font-semibold text-slate-800">{item.productNameSnapshot}</div>
                            <div className="text-[11px] text-slate-500">{item.variantNameSnapshot}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 font-medium">
                        {item.skuSnapshot}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700">
                        <div>{formatCurrency(item.unitPriceSnapshot)}</div>
                        {item.originalPriceSnapshot > item.unitPriceSnapshot && (
                          <div className="text-[10px] text-slate-400 line-through">
                            {formatCurrency(item.originalPriceSnapshot)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        x{item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Totals */}
              <div className="bg-slate-50/80 p-4 border-t border-slate-200 flex flex-col items-end space-y-1.5 text-xs">
                <div className="flex justify-between w-64 text-slate-600">
                  <span>Tạm tính tiền hàng:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(order.subtotalAmount)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between w-64 text-emerald-600">
                    <span className="flex items-center gap-1">
                      <span>Giảm giá:</span>
                      {(() => {
                        try {
                          if (order.couponSnapshot) {
                            const snap = JSON.parse(order.couponSnapshot);
                            if (snap.code) {
                              return <span className="font-mono text-[10px] bg-emerald-100/80 px-1.5 py-0.5 rounded font-bold">{snap.code}</span>;
                            }
                          }
                        } catch {}
                        return <span className="text-[11px] font-normal">(Voucher)</span>;
                      })()}
                    </span>
                    <span className="font-semibold">-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between w-64 text-slate-600">
                  <span>Phí vận chuyển:</span>
                  <span className="font-semibold text-slate-800">
                    {order.shippingFee === 0 ? 'Miễn phí' : formatCurrency(order.shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between w-64 pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-brand-600 text-base">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status History & Audit Trail */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <span>⏱️</span> Lịch sử Xử lý & Audit Log
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              {order.statusHistory && order.statusHistory.length > 0 ? (
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                  {order.statusHistory.map((h, idx) => (
                    <div key={h.id || idx} className="relative flex items-start gap-3.5 pl-1 text-xs">
                      <div className="w-5 h-5 rounded-full bg-white border-2 border-brand-500 flex items-center justify-center shrink-0 z-10 text-[10px]">
                        ●
                      </div>
                      <div className="flex-1 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            {h.fromStatus && (
                              <>
                                <span className="text-slate-500">{ORDER_STATUS_CONFIG[h.fromStatus]?.label || h.fromStatus}</span>
                                <span className="text-slate-400">→</span>
                              </>
                            )}
                            <span className="text-brand-600">{ORDER_STATUS_CONFIG[h.toStatus]?.label || h.toStatus}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {new Date(h.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 mt-1">
                          Thực hiện bởi: <strong className="text-slate-700">{h.changedByName}</strong>
                        </div>

                        {h.reason && (
                          <div className="text-[11px] text-slate-600 mt-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                            Lý do: {h.reason}
                          </div>
                        )}
                        {h.note && (
                          <div className="text-[11px] text-brand-700 mt-1 bg-brand-50/50 p-1.5 rounded border border-brand-100">
                            Ghi chú: {h.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">Chưa có lịch sử trạng thái.</div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer / State Machine Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/90 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Đóng
          </button>

          {canManage && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Transitions for Pending */}
              {order.status === 'Pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleInitiateTransition('Confirmed')}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>✓</span> Xác nhận đơn hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInitiateTransition('Cancelled')}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                  >
                    Hủy đơn
                  </button>
                </>
              )}

              {/* Transitions for Confirmed */}
              {order.status === 'Confirmed' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleInitiateTransition('Processing')}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>📦</span> Chuyển đóng gói kho
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInitiateTransition('Cancelled')}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                  >
                    Hủy đơn
                  </button>
                </>
              )}

              {/* Transitions for Processing */}
              {order.status === 'Processing' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleInitiateTransition('Shipping')}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>🚚</span> Xuất kho & Bàn giao ĐVVC
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInitiateTransition('Cancelled')}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                  >
                    Hủy đơn
                  </button>
                </>
              )}

              {/* Transitions for Shipping */}
              {order.status === 'Shipping' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleInitiateTransition('Completed')}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>🎉</span> Hoàn tất giao hàng & Thu COD
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInitiateTransition('Cancelled')}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                  >
                    Giao thất bại / Hoàn hàng
                  </button>
                </>
              )}

              {/* Transitions for Completed */}
              {order.status === 'Completed' && (
                <button
                  type="button"
                  onClick={() => handleInitiateTransition('ReturnRequested')}
                  className="px-3.5 py-2 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <span>🔄</span> Tiếp nhận yêu cầu Đổi trả
                </button>
              )}

              {/* Transitions for ReturnRequested */}
              {order.status === 'ReturnRequested' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleInitiateTransition('Returned')}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <span>↩️</span> Nhận lại hàng & Hoàn tiền
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInitiateTransition('Completed')}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-xl transition-colors"
                  >
                    Từ chối đổi trả
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation & Note Entry Modal for State Machine */}
      {isConfirmOpen && targetStatus && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{ORDER_STATUS_CONFIG[targetStatus]?.icon || '⚙️'}</span>
              Xác nhận chuyển trạng thái
            </h4>

            <p className="text-xs text-slate-600">
              Bạn đang chuyển đơn <strong className="text-slate-900">{order.orderNumber}</strong> từ{' '}
              <span className="font-semibold text-slate-700">{ORDER_STATUS_CONFIG[order.status]?.label || order.status}</span> sang{' '}
              <strong className="text-brand-600 font-bold">{ORDER_STATUS_CONFIG[targetStatus]?.label || targetStatus}</strong>.
            </p>

            {targetStatus === 'Cancelled' && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                ⚠️ Hủy đơn hàng sẽ tự động giải phóng hoặc nhập lại kho số lượng sản phẩm.
              </div>
            )}

            {targetStatus === 'Shipping' && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-700">
                📦 Xuất kho sẽ trừ số lượng tồn thực tế (OnHand) và tồn đang giữ (Reserved).
              </div>
            )}

            {targetStatus === 'Completed' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
                💰 Đơn hàng COD sẽ tự động cập nhật sang trạng thái "Đã thanh toán (Paid)".
              </div>
            )}

            <div className="space-y-3 pt-1 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lý do chuyển trạng thái {targetStatus === 'Cancelled' && <span className="text-rose-500">*</span>}:
                </label>
                <input
                  type="text"
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  placeholder={targetStatus === 'Cancelled' ? 'Bắt buộc: Khách đổi ý, hết hàng...' : 'Ví dụ: Đã gọi điện xác nhận...'}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú bổ sung (Tùy chọn):
                </label>
                <input
                  type="text"
                  value={transitionNote}
                  onChange={(e) => setTransitionNote(e.target.value)}
                  placeholder="Ghi chú nội bộ cho ca sau hoặc đơn vị vận chuyển..."
                  className="w-full p-2 border border-slate-300 rounded-lg focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isSubmittingTransition}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmTransition}
                disabled={isSubmittingTransition}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors ${
                  targetStatus === 'Cancelled'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-brand-600 hover:bg-brand-700'
                }`}
              >
                {isSubmittingTransition ? 'Đang cập nhật...' : 'Xác nhận chuyển'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailModal;
