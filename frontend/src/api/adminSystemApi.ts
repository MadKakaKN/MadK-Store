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

export const adminSystemApi = {
  getHealth: async (): Promise<ApiEnvelope<SystemHealthReport>> => {
    const res = await apiClient.get<ApiEnvelope<SystemHealthReport>>('/admin/system/health');
    return res.data;
  },

  testSignalR: async (): Promise<ApiEnvelope<boolean>> => {
    const res = await apiClient.post<ApiEnvelope<boolean>>('/admin/system/test-signalr');
    return res.data;
  },

  getRecentWebhooks: async (): Promise<ApiEnvelope<RecentPaymentWebhook[]>> => {
    const res = await apiClient.get<ApiEnvelope<RecentPaymentWebhook[]>>('/admin/system/webhooks/recent');
    return res.data;
  },

  simulateWebhook: async (request: SimulatePaymentWebhookRequest): Promise<ApiEnvelope<string>> => {
    const res = await apiClient.post<ApiEnvelope<string>>('/admin/system/webhooks/simulate', request);
    return res.data;
  },
};

export default adminSystemApi;
