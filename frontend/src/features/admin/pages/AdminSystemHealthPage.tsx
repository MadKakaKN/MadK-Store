import React, { useState, useEffect, useCallback } from 'react';
import adminSystemApi, {
  SystemHealthReport,
  RecentPaymentWebhook,
} from '../../../api/adminSystemApi';
import { formatVND } from '../../../utils/format';
import { useToast } from '../components/common/ToastContext';

export const AdminSystemHealthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'health' | 'webhooks'>('health');
  const [healthData, setHealthData] = useState<SystemHealthReport | null>(null);
  const [recentWebhooks, setRecentWebhooks] = useState<RecentPaymentWebhook[]>([]);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<string | null>(null);

  // Form State giả lập IPN
  const [simGateway, setSimGateway] = useState<'VNPay' | 'MoMo'>('VNPay');
  const [simOrderNumber, setSimOrderNumber] = useState('');
  const [simAmount, setSimAmount] = useState('500000');
  const [simCode, setSimCode] = useState('00');

  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const fetchHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const res = await adminSystemApi.getHealth();
      if (res.data) setHealthData(res.data);
    } catch {
      showErrorToast('Lỗi khi tải dữ liệu kiểm tra sức khỏe hệ thống.');
    } finally {
      setLoadingHealth(false);
    }
  }, [showErrorToast]);

  const fetchWebhooks = useCallback(async () => {
    setLoadingWebhooks(true);
    try {
      const res = await adminSystemApi.getRecentWebhooks();
      if (res.data) setRecentWebhooks(res.data);
    } catch {
      showErrorToast('Lỗi khi tải nhật ký giao dịch Webhook.');
    } finally {
      setLoadingWebhooks(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    fetchHealth();
    fetchWebhooks();
  }, [fetchHealth, fetchWebhooks]);

  const handleTestSignalR = async () => {
    try {
      await adminSystemApi.testSignalR();
      showSuccessToast('Đã phát tín hiệu thử nghiệm SignalR tới toàn bộ Admin!');
    } catch {
      showErrorToast('Lỗi khi phát tín hiệu thử nghiệm SignalR.');
    }
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simOrderNumber.trim()) {
      showErrorToast('Vui lòng nhập Mã đơn hàng cần giả lập IPN.');
      return;
    }

    setIsSimulating(true);
    setSimResult(null);
    try {
      const amountVal = parseFloat(simAmount) || 0;
      const res = await adminSystemApi.simulateWebhook({
        gateway: simGateway,
        orderNumber: simOrderNumber.trim(),
        amount: amountVal,
        resultCode: simCode,
      });

      setSimResult(res.data || 'Đã xử lý IPN thành công.');
      showSuccessToast(`Giả lập Webhook ${simGateway} thành công!`);
      fetchWebhooks();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Lỗi khi gọi Webhook giả lập.';
      setSimResult(`Lỗi: ${msg}`);
      showErrorToast(msg);
    } finally {
      setIsSimulating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Hoạt động tốt
          </span>
        );
      case 'degraded':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Cảnh báo nhẹ
          </span>
        );
      case 'unhealthy':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Ngừng hoạt động
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <nav className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
            <span>Admin</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Hạ tầng & Sức khỏe hệ thống</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Giám sát Hạ tầng & Webhook IPN
            </h1>
            {healthData && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Uptime: {healthData.serverUptime}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi độ trễ Database, hàng đợi thư, bộ nhớ RAM máy chủ và giả lập kiểm thử Webhook thanh toán.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestSignalR}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span>🔔</span> Test Chuông SignalR
          </button>
          <button
            type="button"
            onClick={() => {
              fetchHealth();
              fetchWebhooks();
            }}
            disabled={loadingHealth || loadingWebhooks}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
          >
            <svg
              className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Làm mới
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'health'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>🖥️</span> Sức khỏe Hạ tầng & Dịch vụ
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('webhooks')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'webhooks'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>⚡</span> Giả lập & Quản lý Webhook IPN
        </button>
      </div>

      {/* TAB 1: Sức khỏe hạ tầng */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          {/* Resource KPIs */}
          {healthData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Trạng thái tổng thể
                </span>
                <div className="mt-2 flex items-center gap-2">
                  {getStatusBadge(healthData.overallStatus)}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Bộ nhớ RAM Máy chủ
                </span>
                <div className="mt-1">
                  <span className="text-xl font-black text-slate-900">
                    {healthData.resources.workingSetMb} MB
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    GC Heap: {healthData.resources.gcMemoryMb} MB
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Phần cứng & CPU
                </span>
                <div className="mt-1">
                  <span className="text-xl font-black text-slate-900">
                    {healthData.resources.cpuCores} Cores
                  </span>
                  <span className="text-[11px] text-slate-400 truncate block mt-0.5" title={healthData.resources.machineName}>
                    Host: {healthData.resources.machineName}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Môi trường Runtime
                </span>
                <div className="mt-1">
                  <span className="text-xl font-black text-slate-900">
                    .NET 8.0
                  </span>
                  <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                    {healthData.resources.osVersion}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Services Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">
                Chi tiết kết nối các dịch vụ cốt lõi
              </h3>
              <span className="text-xs text-slate-400">
                Cập nhật lúc: {healthData ? new Date(healthData.checkedAt).toLocaleTimeString() : '...'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-3.5 pl-5">Dịch vụ</th>
                    <th className="p-3.5">Trạng thái</th>
                    <th className="p-3.5">Độ trễ (Latency)</th>
                    <th className="p-3.5 pr-5">Thông tin chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {healthData?.services.map((svc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 pl-5 font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        {svc.serviceName}
                      </td>
                      <td className="p-3.5">{getStatusBadge(svc.status)}</td>
                      <td className="p-3.5 font-mono font-semibold">
                        {svc.latencyMs > 0 ? (
                          <span
                            className={
                              svc.latencyMs < 50
                                ? 'text-emerald-600'
                                : svc.latencyMs < 200
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }
                          >
                            {svc.latencyMs} ms
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3.5 pr-5 text-slate-500 max-w-md truncate" title={svc.details || ''}>
                        {svc.details || 'Bình thường'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Giả lập & Quản lý Webhook IPN */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          {/* IPN Simulator Card */}
          <div className="bg-gradient-to-r from-blue-50/60 via-indigo-50/30 to-purple-50/40 rounded-3xl border border-blue-200/80 p-5 shadow-xs">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🧪</span>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Hộp công cụ Giả lập Webhook IPN (Sandbox Testing)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                  KHÔNG CẦN NGROK
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Gửi tín hiệu IPN trực tiếp vào pipeline xử lý thanh toán của backend để kiểm tra tự động đổi trạng thái đơn sang <strong>Đã thanh toán (Paid)</strong>, trừ tồn kho và gửi email.
              </p>
            </div>

            <form onSubmit={handleSimulateWebhook} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Cổng thanh toán
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-white p-1 rounded-xl border border-slate-300">
                  <button
                    type="button"
                    onClick={() => {
                      setSimGateway('VNPay');
                      setSimCode('00');
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      simGateway === 'VNPay' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    VNPay
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimGateway('MoMo');
                      setSimCode('0');
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      simGateway === 'MoMo' ? 'bg-pink-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    MoMo
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Mã đơn hàng
                </label>
                <input
                  type="text"
                  value={simOrderNumber}
                  onChange={(e) => setSimOrderNumber(e.target.value)}
                  placeholder="Ví dụ: MK-20261108-001"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-blue-500 focus:outline-none bg-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Số tiền thanh toán (VNĐ)
                </label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  placeholder="500000"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-blue-500 focus:outline-none bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Kết quả giao dịch
                </label>
                <select
                  value={simCode}
                  onChange={(e) => setSimCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-blue-500 focus:outline-none bg-white font-medium"
                >
                  {simGateway === 'VNPay' ? (
                    <>
                      <option value="00">00 - Thành công (Giao dịch hoàn tất)</option>
                      <option value="01">01 - Chưa hoàn tất</option>
                      <option value="02">02 - Lỗi / Khách hủy giao dịch</option>
                    </>
                  ) : (
                    <>
                      <option value="0">0 - Thành công (Giao dịch hoàn tất)</option>
                      <option value="1006">1006 - Người dùng hủy giao dịch</option>
                      <option value="9000">9000 - Giao dịch đã được xác nhận</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  {isSimulating ? 'Đang bắn IPN...' : '⚡ Bắn Webhook IPN'}
                </button>
              </div>
            </form>

            {simResult && (
              <div className="mt-3 p-3 rounded-xl bg-white border border-blue-200 text-xs font-mono text-slate-800 shadow-2xs">
                <strong>Phản hồi từ cổng:</strong> {simResult}
              </div>
            )}
          </div>

          {/* Recent Webhooks / Payments Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  Nhật ký giao dịch & Webhook IPN gần đây
                </h3>
                <p className="text-xs text-slate-400">
                  Bấm vào mã đơn hàng để tự điền nhanh vào khung giả lập bên trên
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {recentWebhooks.length} giao dịch gần nhất
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-3.5 pl-5">Đơn hàng</th>
                    <th className="p-3.5">Cổng thanh toán</th>
                    <th className="p-3.5">Số tiền</th>
                    <th className="p-3.5">Mã GD (TxnNo)</th>
                    <th className="p-3.5">Trạng thái</th>
                    <th className="p-3.5">Mã code</th>
                    <th className="p-3.5 pr-5">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentWebhooks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Chưa có lịch sử giao dịch thanh toán nào được ghi nhận.
                      </td>
                    </tr>
                  ) : (
                    recentWebhooks.map((p) => (
                      <tr key={p.paymentId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5 pl-5 font-mono font-bold text-blue-600">
                          <button
                            type="button"
                            onClick={() => {
                              setSimOrderNumber(p.orderNumber);
                              setSimAmount(p.amount.toString());
                              if (p.paymentMethod.toLowerCase().includes('momo')) {
                                setSimGateway('MoMo');
                                setSimCode('0');
                              } else {
                                setSimGateway('VNPay');
                                setSimCode('00');
                              }
                            }}
                            className="hover:underline text-left"
                            title="Bấm để đưa mã này vào form giả lập"
                          >
                            #{p.orderNumber}
                          </button>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800">
                          {p.paymentMethod}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {formatVND(p.amount)}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">
                          {p.transactionNo || '—'}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              p.status.toLowerCase() === 'completed' || p.status.toLowerCase() === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status.toLowerCase() === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-600">
                          {p.responseCode || '—'}
                        </td>
                        <td className="p-3.5 pr-5 text-slate-400 whitespace-nowrap">
                          {new Date(p.createdAt).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSystemHealthPage;
