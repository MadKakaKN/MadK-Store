import * as signalR from '@microsoft/signalr';
import { tokenStorage } from '../api/authApi';

export interface RealtimeOrderPayload {
  type: string;
  orderId: string;
  orderNumber: string;
  customerName?: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  status: string;
  title: string;
  message: string;
}

export interface RealtimeStatusPayload {
  type: string;
  orderId: string;
  orderNumber: string;
  oldStatus: string;
  newStatus: string;
  updatedAt: string;
  title: string;
  message: string;
}

export interface RealtimePaymentPayload {
  type: string;
  orderNumber: string;
  amount: number;
  gateway: string;
  refCode?: string;
  paidAt: string;
  title: string;
  message: string;
}

export interface RealtimeLowStockPayload {
  type: string;
  productName: string;
  sku: string;
  availableQuantity: number;
  alertAt: string;
  title: string;
  message: string;
}

// Hàm phát chuông âm thanh Ting Ting qua Web Audio API (hoạt động 100% offline, không cần tải file mp3)
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Nốt thứ 1 (587.33 Hz - D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.18, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Nốt thứ 2 (880 Hz - A5) phát sau 120ms tạo hợp âm vui tai
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.22, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.55);
  } catch {
    // Trình duyệt chưa cấp quyền user interaction
  }
};

class SignalRManager {
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;

  private getHubUrl(): string {
    const base = import.meta.env.VITE_API_BASE_URL ||
      (import.meta.env.PROD ? 'https://madk-api.onrender.com/api/v1' : 'http://localhost:5000/api/v1');
    return `${base.replace(/\/api\/v1\/?$/, '')}/hubs/notifications`;
  }

  public async startConnection(): Promise<signalR.HubConnection | null> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    if (this.isConnecting) return null;
    this.isConnecting = true;

    try {
      const hubUrl = this.getHubUrl();
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => {
            const token = tokenStorage.getAccessToken();
            return token && !token.startsWith('mock_') ? token : '';
          },
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      await this.connection.start();
      this.isConnecting = false;
      return this.connection;
    } catch {
      this.isConnecting = false;
      return null;
    }
  }

  public stopConnection() {
    if (this.connection) {
      this.connection.stop();
      this.connection = null;
    }
  }

  public getConnection(): signalR.HubConnection | null {
    return this.connection;
  }
}

export const signalRManager = new SignalRManager();
