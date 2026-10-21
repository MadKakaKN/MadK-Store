import React, { useState } from 'react';
import DataTable, { ColumnDef } from '../components/common/DataTable';
import Badge, { BadgeVariant } from '../components/common/Badge';
import ConfirmModal from '../components/common/ConfirmModal';

interface AuditLogRow {
  id: string;
  userEmail: string;
  userRole: string;
  action: string;
  entityName: string;
  entityId: string;
  oldValues: string;
  newValues: string;
  note: string;
  createdAt: string;
}

const INITIAL_AUDIT_LOGS: AuditLogRow[] = [
  {
    id: 'log-1',
    userEmail: 'admin@madkstore.vn',
    userRole: 'Admin',
    action: 'USER_ROLE_ASSIGNED',
    entityName: 'User',
    entityId: 'u-2',
    oldValues: '{"Roles":["Customer"]}',
    newValues: '{"Roles":["Sales"]}',
    note: 'Gán lại vai trò cho nhân viên mới',
    createdAt: '2026-10-15 08:35:12',
  },
  {
    id: 'log-2',
    userEmail: 'sales@madkstore.vn',
    userRole: 'Sales',
    action: 'ORDER_STATUS_CHANGED',
    entityName: 'Order',
    entityId: 'MK-20261015-9872',
    oldValues: '{"Status":"Pending"}',
    newValues: '{"Status":"Confirmed","Reason":"Khách đã xác nhận qua điện thoại"}',
    note: 'Duyệt đơn hàng sau khi liên hệ khách',
    createdAt: '2026-10-15 08:16:45',
  },
  {
    id: 'log-3',
    userEmail: 'warehouse@madkstore.vn',
    userRole: 'Warehouse',
    action: 'INVENTORY_RESTOCKED',
    entityName: 'Inventory',
    entityId: 'IP16PM-256-DESERT',
    oldValues: '{"OnHandQuantity":35}',
    newValues: '{"OnHandQuantity":45,"Added":10,"Reason":"Nhập kho định kỳ"}',
    note: 'Nhập 10 máy từ kho tổng',
    createdAt: '2026-10-15 08:01:10',
  },
  {
    id: 'log-4',
    userEmail: 'admin@madkstore.vn',
    userRole: 'Admin',
    action: 'PRODUCT_PRICE_UPDATED',
    entityName: 'ProductVariant',
    entityId: 'S24U-512-TITAN',
    oldValues: '{"SalePrice":31990000}',
    newValues: '{"SalePrice":29990000}',
    note: 'Điều chỉnh giá kích cầu cuối tuần',
    createdAt: '2026-10-14 18:22:04',
  },
  {
    id: 'log-5',
    userEmail: 'sales@madkstore.vn',
    userRole: 'Sales',
    action: 'DISCOUNT_CREATED',
    entityName: 'Discount',
    entityId: 'MADK2026',
    oldValues: 'null',
    newValues: '{"Code":"MADK2026","DiscountPercent":10,"MaxAmount":500000}',
    note: 'Tạo mã voucher chiến dịch tháng 10',
    createdAt: '2026-10-14 14:10:30',
  },
];

const ACTION_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  USER_ROLE_ASSIGNED: { label: 'Gán vai trò', variant: 'purple' },
  USER_STATUS_UPDATED: { label: 'Đổi trạng thái tài khoản', variant: 'danger' },
  ORDER_STATUS_CHANGED: { label: 'Chuyển trạng thái đơn', variant: 'info' },
  ORDER_CANCELLED_BY_STAFF: { label: 'Nhân viên hủy đơn', variant: 'danger' },
  INVENTORY_RESTOCKED: { label: 'Nhập thêm kho', variant: 'success' },
  PRODUCT_PRICE_UPDATED: { label: 'Cập nhật giá', variant: 'warning' },
  DISCOUNT_CREATED: { label: 'Tạo voucher', variant: 'neutral' },
};

export const AdminAuditLogsPage: React.FC = () => {
  const [logs] = useState<AuditLogRow[]>(INITIAL_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [activeLog, setActiveLog] = useState<AuditLogRow | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchAction = selectedAction === 'ALL' || log.action === selectedAction;
    const matchSearch =
      !searchQuery ||
      log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.note.toLowerCase().includes(searchQuery.toLowerCase());
    return matchAction && matchSearch;
  });

  const columns: ColumnDef<AuditLogRow>[] = [
    {
      key: 'userEmail',
      title: 'Nhân viên thực hiện',
      render: (row) => (
        <div>
          <div className="font-semibold text-xs text-slate-900">{row.userEmail}</div>
          <div className="text-[10px] text-slate-500 font-mono">Vai trò: {row.userRole}</div>
        </div>
      ),
    },
    {
      key: 'action',
      title: 'Hành động',
      render: (row) => {
        const item = ACTION_MAP[row.action] || { label: row.action, variant: 'neutral' };
        return (
          <Badge variant={item.variant} size="sm">
            {item.label}
          </Badge>
        );
      },
    },
    {
      key: 'entity',
      title: 'Đối tượng tác động',
      render: (row) => (
        <div>
          <span className="font-semibold text-xs text-slate-700">{row.entityName}</span>
          <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[150px]">
            ID: {row.entityId}
          </span>
        </div>
      ),
    },
    {
      key: 'note',
      title: 'Ghi chú / Mô tả',
      render: (row) => (
        <span className="text-xs text-slate-600 line-clamp-1">{row.note}</span>
      ),
    },
    {
      key: 'createdAt',
      title: 'Thời điểm',
      render: (row) => <span className="text-xs text-slate-500">{row.createdAt}</span>,
    },
    {
      key: 'actions',
      title: 'Chi tiết',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={() => setActiveLog(row)}
          className="px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-md transition-colors"
        >
          Xem Diff
        </button>
      ),
    },
  ];

  const actionFilterOptions = [
    { value: 'ALL', label: 'Tất cả hành động' },
    { value: 'USER_ROLE_ASSIGNED', label: 'Gán vai trò' },
    { value: 'ORDER_STATUS_CHANGED', label: 'Chuyển trạng thái đơn' },
    { value: 'INVENTORY_RESTOCKED', label: 'Nhập thêm kho' },
    { value: 'PRODUCT_PRICE_UPDATED', label: 'Cập nhật giá' },
    { value: 'DISCOUNT_CREATED', label: 'Tạo voucher' },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Nhật ký Kiểm toán (Audit Log)</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Ghi lại đầy đủ ai đã thực hiện thao tác gì, trên thực thể nào, giá trị trước và sau, thời điểm và IP.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Tìm kiếm theo email, đối tượng, ghi chú..."
        filters={
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
          >
            {actionFilterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        }
        currentPage={1}
        pageSize={10}
        onPageChange={() => {}}
      />

      {/* Audit Log Detail Modal */}
      <ConfirmModal
        isOpen={!!activeLog}
        onClose={() => setActiveLog(null)}
        onConfirm={() => setActiveLog(null)}
        title="Chi tiết biến động dữ liệu (Audit Log Diff)"
        message={
          activeLog ? (
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Nhân viên thực hiện:</span>
                  <span className="font-semibold text-slate-900">{activeLog.userEmail}</span>
                  <span className="text-slate-500 block">({activeLog.userRole})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Thời điểm ghi nhận:</span>
                  <span className="font-semibold text-slate-900">{activeLog.createdAt}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-rose-700 block mb-1">
                  Giá trị trước thay đổi (OldValues):
                </span>
                <pre className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                  {activeLog.oldValues}
                </pre>
              </div>

              <div>
                <span className="font-semibold text-emerald-700 block mb-1">
                  Giá trị sau thay đổi (NewValues):
                </span>
                <pre className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                  {activeLog.newValues}
                </pre>
              </div>

              <div className="text-slate-500 text-[11px]">
                <strong>Ghi chú:</strong> {activeLog.note}
              </div>
            </div>
          ) : null
        }
        confirmText="Đóng"
        cancelText=""
        variant="info"
      />
    </div>
  );
};

export default AdminAuditLogsPage;
