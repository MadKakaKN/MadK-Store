/**
 * Utility functions for text normalization, especially Vietnamese diacritic removal.
 */

/**
 * Chuyển đổi chuỗi tiếng Việt có dấu sang không dấu (lowercase, trim).
 * Ví dụ:
 *  - "Điện thoại thông minh" -> "dien thoai thong minh"
 *  - "Bàn phím cơ & Chuột không dây" -> "ban phim co & chuot khong day"
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (m) => (m === 'đ' || m === 'Đ' ? 'd' : 'D'))
    .toLowerCase()
    .trim();
}

/**
 * Chuyển chuỗi thành slug URL chuẩn
 */
export function slugify(str: string): string {
  const unaccented = removeVietnameseTones(str);
  return unaccented
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
