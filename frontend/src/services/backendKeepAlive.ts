import apiClient from '../api/apiClient';

/**
 * Service đánh thức và duy trì kết nối tới Cloud Backend (Render Keep-Alive)
 * - Tự động gọi /api/v1/ping khi người dùng vừa mở trang web
 * - Định kỳ gửi heartbeat mỗi 10 phút nếu tab trình duyệt đang mở để ngăn Render Free Tier rơi vào trạng thái ngủ (spin down sau 15p)
 */
class BackendKeepAliveService {
  private timer: number | null = null;
  private isWarmingUp: boolean = false;

  public init(): void {
    // Ping lần đầu ngay khi nạp ứng dụng
    this.ping();

    // Thiết lập timer định kỳ 10 phút (600,000ms)
    if (typeof window !== 'undefined') {
      this.timer = window.setInterval(() => {
        // Chỉ ping nếu trang web đang được hiển thị (không ẩn hoàn toàn)
        if (!document.hidden) {
          this.ping();
        }
      }, 10 * 60 * 1000);

      // Khi người dùng quay lại tab sau khi thu nhỏ, kiểm tra và ping lại nếu cần
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.ping();
        }
      });
    }
  }

  public async ping(): Promise<boolean> {
    if (this.isWarmingUp) return false;
    this.isWarmingUp = true;
    try {
      await apiClient.get('/ping', { timeout: 15000 });
      return true;
    } catch {
      // Bỏ qua lỗi kết nối ngầm khi mạng chập chờn
      return false;
    } finally {
      this.isWarmingUp = false;
    }
  }

  public destroy(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const backendKeepAlive = new BackendKeepAliveService();
