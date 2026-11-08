import { apiClient } from './apiClient';

export interface EmailStatusDto {
  host: string;
  port: number;
  fromEmail: string;
  fromName: string;
  enableSsl: boolean;
  useMock: boolean;
  isConfigured: boolean;
}

export const adminNotificationApi = {
  getEmailStatus: async () => {
    const res = await apiClient.get('/admin/notifications/email/status');
    return res.data?.data as EmailStatusDto;
  },

  testEmail: async (recipientEmail: string) => {
    const res = await apiClient.post('/admin/notifications/email/test', { recipientEmail });
    return res.data;
  },

  testRealtime: async () => {
    const res = await apiClient.post('/admin/notifications/realtime/test');
    return res.data;
  },

  testTelegram: async () => {
    const res = await apiClient.post('/admin/notifications/telegram/test');
    return res.data;
  },
};
