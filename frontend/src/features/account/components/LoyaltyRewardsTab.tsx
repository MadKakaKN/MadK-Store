import React, { useState, useEffect, useCallback } from 'react';
import loyaltyApi, { LoyaltyAccountDto, LoyaltyTransactionDto } from '../../../api/loyaltyApi';
import { formatVND } from '../../../utils/format';

export const LoyaltyRewardsTab: React.FC = () => {
  const [account, setAccount] = useState<LoyaltyAccountDto | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransactionDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchLoyaltyData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [accRes, histRes] = await Promise.all([
        loyaltyApi.getAccount(),
        loyaltyApi.getHistory(page, pageSize),
      ]);

      if (accRes.isSuccess && accRes.data) {
        setAccount(accRes.data);
      } else {
        setErrorMessage(accRes.error || 'Không thể tải thông tin điểm thưởng.');
      }

      if (histRes.isSuccess && histRes.data) {
        setTransactions(histRes.data.items);
        setTotalCount(histRes.data.totalCount);
      }
    } catch {
      setErrorMessage('Lỗi kết nối khi tải thông tin điểm thưởng.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchLoyaltyData();
  }, [fetchLoyaltyData]);

  const getTierBadge = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'diamond':
        return {
          icon: '💎',
          label: 'Hạng Kim Cương',
          bg: 'from-cyan-900 via-blue-900 to-indigo-950',
          textColor: 'text-cyan-300',
          badgeBg: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
        };
      case 'gold':
        return {
          icon: '🥇',
          label: 'Hạng Vàng',
          bg: 'from-amber-700 via-yellow-700 to-amber-900',
          textColor: 'text-amber-200',
          badgeBg: 'bg-yellow-400/20 text-yellow-200 border-yellow-300/40',
        };
      case 'silver':
        return {
          icon: '🥈',
          label: 'Hạng Bạc',
          bg: 'from-slate-700 via-slate-800 to-zinc-900',
          textColor: 'text-slate-200',
          badgeBg: 'bg-slate-400/20 text-slate-200 border-slate-400/40',
        };
      default:
        return {
          icon: '🥉',
          label: 'Hạng Đồng',
          bg: 'from-amber-900 via-stone-800 to-amber-950',
          textColor: 'text-amber-300',
          badgeBg: 'bg-amber-600/20 text-amber-300 border-amber-500/40',
        };
    }
  };

  const getTxTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'earned':
        return {
          label: 'Cộng điểm đơn hàng',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          prefix: '+',
          color: 'text-emerald-600',
        };
      case 'redeemed':
        return {
          label: 'Đổi điểm checkout',
          className: 'bg-rose-50 text-rose-700 border-rose-200',
          prefix: '',
          color: 'text-rose-600',
        };
      case 'refunded':
        return {
          label: 'Hoàn lại điểm',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
          prefix: '+',
          color: 'text-blue-600',
        };
      case 'adjusted':
        return {
          label: 'Điều chỉnh hệ thống',
          className: 'bg-purple-50 text-purple-700 border-purple-200',
          prefix: '',
          color: 'text-purple-600',
        };
      default:
        return {
          label: type,
          className: 'bg-slate-50 text-slate-700 border-slate-200',
          prefix: '',
          color: 'text-slate-700',
        };
    }
  };

  if (isLoading && !account) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Đang tải thẻ hội viên & điểm thưởng...</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !account) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center">
        <p className="text-sm text-rose-600 font-semibold mb-3">{errorMessage}</p>
        <button
          type="button"
          onClick={fetchLoyaltyData}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const tierMeta = getTierBadge(account?.tier || 'Bronze');
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* 1. Virtual Membership Rewards Card */}
      <div
        className={`rounded-3xl p-6 sm:p-8 bg-gradient-to-br ${tierMeta.bg} text-white shadow-xl shadow-slate-900/10 relative overflow-hidden`}
      >
        {/* Background decorative circles */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none blur-2xl" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none blur-2xl" />

        <div className="relative z-10 space-y-6">
          {/* Card Top: Store Brand & Tier Badge */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">⚡</span>
              <div>
                <span className="font-black text-sm tracking-widest uppercase">MadK Rewards</span>
                <span className="text-[10px] block opacity-70">Chương trình Khách hàng thân thiết</span>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 backdrop-blur-md ${tierMeta.badgeBg}`}
            >
              <span>{tierMeta.icon}</span>
              <span>{tierMeta.label}</span>
            </div>
          </div>

          {/* Card Middle: Current Points Balance */}
          <div className="py-2">
            <span className="text-xs uppercase tracking-wider opacity-75 font-semibold block">
              Số điểm khả dụng (1 điểm = 1 VNĐ)
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-white">
                {account?.currentBalance.toLocaleString() || 0}
              </span>
              <span className="text-sm sm:text-base font-bold opacity-80">
                điểm ≈ {formatVND(account?.pointsValueVnd || 0)}
              </span>
            </div>
          </div>

          {/* Card Bottom: Member Details & Earn Rate */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase opacity-70 block">Tỷ lệ tích điểm hiện tại</span>
              <span className="font-extrabold text-sm text-amber-300">
                +{account?.earnRatePercent || 1}% mỗi đơn hàng
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase opacity-70 block">Điểm tích lũy trọn đời</span>
              <span className="font-mono font-bold text-white">
                {account?.lifetimePoints.toLocaleString() || 0} điểm
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase opacity-70 block">Tổng chi tiêu</span>
              <span className="font-mono font-bold text-white">
                {formatVND(account?.totalSpent || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Next Tier Progress Banner */}
      {account?.nextTier && account?.spentNeededForNextTier !== null && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700 flex items-center gap-1.5">
              <span>🚀</span>
              <span>
                Thăng hạng tiếp theo: <strong className="text-brand-600 font-bold">Hạng {account.nextTier}</strong>
              </span>
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              Cần thêm: <strong className="text-slate-900">{formatVND(account.spentNeededForNextTier || 0)}</strong>
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            {(() => {
              const spent = account.totalSpent || 0;
              const needed = account.spentNeededForNextTier || 1;
              const totalTarget = spent + needed;
              const percent = Math.min(100, Math.max(0, Math.round((spent / totalTarget) * 100)));
              return (
                <div
                  className="bg-gradient-to-r from-amber-500 to-brand-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              );
            })()}
          </div>
          <p className="text-[11px] text-slate-500">
            * Mua sắm thêm để nâng hạng và mở khóa tỷ lệ tích điểm cao hơn (lên tới 5% cho Hạng Kim Cương).
          </p>
        </div>
      )}

      {/* 3. Rewards Policy Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs space-y-1">
          <span className="text-lg">💵</span>
          <p className="font-bold text-amber-950">Quy đổi 1:1 đơn giản</p>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            1 điểm thưởng = 1 VNĐ. Trừ trực tiếp vào hóa đơn thanh toán khi đặt hàng.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-xs space-y-1">
          <span className="text-lg">🛒</span>
          <p className="font-bold text-emerald-950">Tối đa 50% đơn hàng</p>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            Bạn có thể dùng điểm để giảm tối đa 50% giá trị tiền hàng cho mỗi đơn.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/60 text-xs space-y-1">
          <span className="text-lg">🔄</span>
          <p className="font-bold text-indigo-950">Bảo vệ quyền lợi hoàn điểm</p>
          <p className="text-[11px] text-indigo-800 leading-relaxed">
            Nếu đơn hàng bị hủy hoặc hoàn trả, điểm thưởng đã sử dụng sẽ được hoàn trả tự động vào tài khoản.
          </p>
        </div>
      </div>

      {/* 4. Points Transaction History */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <span>📜</span>
            <span>Lịch sử biến động điểm</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {totalCount} giao dịch
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <span className="text-3xl block">🎁</span>
            <p className="font-medium text-slate-600">Chưa có biến động điểm thưởng nào.</p>
            <p className="text-[11px] text-slate-400">
              Điểm thưởng sẽ tự động được cộng vào tài khoản khi đơn hàng giao thành công!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const meta = getTxTypeBadge(tx.type);
              const isPositive = tx.points > 0;
              return (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.className}`}>
                        {meta.label}
                      </span>
                      {tx.orderNumber && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Đơn: {tx.orderNumber}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-slate-800 truncate">{tx.description}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(tx.createdAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`font-mono font-bold text-sm ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isPositive ? `+${tx.points.toLocaleString()}` : tx.points.toLocaleString()} điểm
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Số dư: {tx.balanceAfter.toLocaleString()} điểm
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 font-semibold transition-colors"
            >
              Trang trước
            </button>
            <span className="text-slate-500 font-mono">
              Trang {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 font-semibold transition-colors"
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoyaltyRewardsTab;
