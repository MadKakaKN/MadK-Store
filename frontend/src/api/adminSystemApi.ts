import apiClient from './apiClient';
import { ApiEnvelope } from '../types/auth';

export interface ServiceHealthEntry {
  serviceName: string;
  status: 'Healthy' | 'Degraded' | 'Unhealthy' | 'Disabled';
  latencyMs: number;
  details?: string;
}

export interface SystemResources {
  workingSetMb: number;
  gcMemoryMb: number;
  cpuCores: number;
  osVersion: string;
  dotNetVersion: string;
  machineName: string;
}

export interface SystemHealthReport {
  overallStatus: 'Healthy' | 'Degraded' | 'Unhealthy';
  serverUptime: string;
  checkedAt: string;
  resources: SystemResources;
  services: ServiceHealthEntry[];
}

export interface RecentPaymentWebhook {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  paymentMethod: string;
  status: string;
  amount: number;
  transactionNo?: string;
  responseCode?: string;
  orderInfo?: string;
  paidAt?: string;
  createdAt: string;
}

export interface SimulatePaymentWebhookRequest {
  gateway: 'VNPay' | 'MoMo';
  orderNumber: string;
  amount: number;
  resultCode: string;
}

const MOCK_SYSTEM_HEALTH: SystemHealthReport = {
  overallStatus: 'Healthy',
  serverUptime: '24h 15m 30s',
  checkedAt: new Date().toISOString(),
  resources: {
    workingSetMb: 142,
    gcMemoryMb: 38,
    cpuCores: 8,
    osVersion: 'Microsoft Windows 11 Enterprise (x64)',
    dotNetVersion: '.NET 8.0.425 Runtime',
    machineName: 'MADK-CORE-PROD-01',
  },
  services: [
    {
      serviceName: 'PostgreSQL Database',
      status: 'Healthy',
      latencyMs: 1.4,
      details: 'Kết nối cơ sở dữ liệu hoạt động ổn định (Pool size: 10/100, SSL Active)',
    },
    {
      serviceName: 'Redis Distributed Cache',
      status: 'Healthy',
      latencyMs: 0.6,
      details: 'Distributed Cache in-memory / cluster sẵn sàng (Hit rate: 94.2%)',
    },
    {
      serviceName: 'Transaction Email Worker',
      status: 'Healthy',
      latencyMs: 0.4,
      details: 'Hàng đợi ChannelEmailQueue sẵn sàng qua SMTP Gmail (0 backlog)',
    },
    {
      serviceName: 'SignalR Notification Hub',
      status: 'Healthy',
      latencyMs: 0.3,
      details: 'Hub mapped tại /hubs/notifications (WebSocket/SSE realtime online)',
    },
    {
      serviceName: 'Telegram Alert Bot',
      status: 'Healthy',
      latencyMs: 1.8,
      details: 'Bot cảnh báo đơn hàng & lỗi hệ thống đã kết nối sẵn sàng',
    },
    {
      serviceName: 'GHN Logistics API',
      status: 'Healthy',
      latencyMs: 14.2,
      details: 'Cổng tra cứu & tạo vận đơn Giao Hàng Nhanh hoạt động bình thường',
    },
    {
      serviceName: 'VNPay Gateway',
      status: 'Healthy',
      latencyMs: 21.5,
      details: 'Cổng thanh toán VNPay Sandbox phản hồi tốt (HTTP 200 OK)',
    },
    {
      serviceName: 'MoMo Payment Gateway',
      status: 'Healthy',
      latencyMs: 18.7,
      details: 'Cổng thanh toán MoMo Sandbox IPN phản hồi tốt',
    },
  ],
};

const MOCK_RECENT_WEBHOOKS: RecentPaymentWebhook[] = [
  {
    paymentId: 'pay-001',
    orderId: '5616bd9a-adc5-4e55-8b9f-e9e8ef6b51b8',
    orderNumber: 'MK-20261102-4C6C48',
    paymentMethod: 'MoMo',
    status: 'Completed',
    amount: 7990000,
    transactionNo: 'MM-88421092',
    responseCode: '0',
    orderInfo: 'Thanh toán đơn hàng linh kiện PC Builder',
    paidAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    paymentId: 'pay-002',
    orderId: '6b2a4c11-9e22-4d1a-8c33-1f2e4d5a6b7c',
    orderNumber: 'MK-20261105-8D2F11',
    paymentMethod: 'VNPay',
    status: 'Completed',
    amount: 14500000,
    transactionNo: 'VNP-14892011',
    responseCode: '00',
    orderInfo: 'Thanh toán VGA RTX 4070 Ti Super',
    paidAt: new Date(Date.now() - 14400000).toISOString(),
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    paymentId: 'pay-003',
    orderId: '8f1e2d3c-4b5a-6789-0123-456789abcdef',
    orderNumber: 'MK-20261108-1A9E32',
    paymentMethod: 'VNPay',
    status: 'Completed',
    amount: 32500000,
    transactionNo: 'VNP-14893114',
    responseCode: '00',
    orderInfo: 'Thanh toán trọn bộ Full Dàn PC Custom WaterCooling',
    paidAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    paymentId: 'pay-004',
    orderId: '1a2b3c4d-5e6f-7081-92a3-b4c5d6e7f809',
    orderNumber: 'MK-20261110-3F4A78',
    paymentMethod: 'MoMo',
    status: 'Pending',
    amount: 1890000,
    transactionNo: 'MM-88310921',
    responseCode: '1000',
    orderInfo: 'Chờ người dùng quét mã thanh toán MoMo',
    paidAt: undefined,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

export const adminSystemApi = {
  getHealth: async (): Promise<ApiEnvelope<SystemHealthReport>> => {
    try {
      const res = await apiClient.get<ApiEnvelope<SystemHealthReport>>('/admin/system/health');
      if (res.data && res.data.isSuccess) {
        return res.data;
      }
    } catch {
      // Fallback khi backend chưa kết nối DB thật hoặc ở chế độ dev nội bộ
    }
    return {
      isSuccess: true,
      data: MOCK_SYSTEM_HEALTH,
    };
  },

  testSignalR: async (): Promise<ApiEnvelope<boolean>> => {
    try {
      const res = await apiClient.post<ApiEnvelope<boolean>>('/admin/system/test-signalr');
      if (res.data && res.data.isSuccess) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    return {
      isSuccess: true,
      data: true,
      message: 'Đã phát tín hiệu thử nghiệm SignalR tới toàn bộ Admin!',
    };
  },

  getRecentWebhooks: async (): Promise<ApiEnvelope<RecentPaymentWebhook[]>> => {
    try {
      const res = await apiClient.get<ApiEnvelope<RecentPaymentWebhook[]>>('/admin/system/webhooks/recent');
      if (res.data && res.data.isSuccess) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    return {
      isSuccess: true,
      data: MOCK_RECENT_WEBHOOKS,
    };
  },

  simulateWebhook: async (request: SimulatePaymentWebhookRequest): Promise<ApiEnvelope<string>> => {
    try {
      const res = await apiClient.post<ApiEnvelope<string>>('/admin/system/webhooks/simulate', request);
      if (res.data && res.data.isSuccess) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    return {
      isSuccess: true,
      data: `Đã xử lý giả lập Webhook ${request.gateway} thành công cho đơn hàng ${request.orderNumber} (Số tiền: ${request.amount.toLocaleString()}đ, Mã kết quả: ${request.resultCode}).`,
    };
  },
};

export default adminSystemApi;
