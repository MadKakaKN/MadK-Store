import React from 'react';
import { OrderStatus, ORDER_STATUS_CONFIG } from '../../../../types/order';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const config = ORDER_STATUS_CONFIG[status] || {
    label: status,
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    icon: '📦',
    description: '',
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
    lg: 'text-sm px-4 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border shadow-2xs ${config.badgeBg} ${config.badgeText} ${config.badgeBorder} ${sizeClasses}`}
      title={config.description}
    >
      {showIcon && <span className="text-xs leading-none">{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
};
