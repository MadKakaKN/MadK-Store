export interface RecentlyViewedItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  thumbnailUrl?: string;
  categoryName?: string;
  viewedAt: number;
}

const STORAGE_KEY = 'madk_recently_viewed';
const MAX_ITEMS = 10;

export function addRecentlyViewed(item: Omit<RecentlyViewedItem, 'viewedAt'>): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let items: RecentlyViewedItem[] = raw ? JSON.parse(raw) : [];

    // Filter out if already present
    items = items.filter((i) => i.id !== item.id && i.slug !== item.slug);

    // Prepend new item
    items.unshift({
      ...item,
      viewedAt: Date.now(),
    });

    if (items.length > MAX_ITEMS) {
      items = items.slice(0, MAX_ITEMS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    // Ignore storage issues
  }
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function clearRecentlyViewed(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
