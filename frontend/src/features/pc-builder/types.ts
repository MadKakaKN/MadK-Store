export type ComponentSlotId =
  | 'cpu'
  | 'mainboard'
  | 'ram'
  | 'vga'
  | 'ssd'
  | 'hdd'
  | 'psu'
  | 'case'
  | 'cooler'
  | 'monitor'
  | 'gear';

export interface ComponentSlotConfig {
  id: ComponentSlotId;
  name: string;
  categoryName: string;
  categorySlug: string;
  icon: string;
  required: boolean;
  description: string;
}

export interface SelectedPart {
  id: string;
  name: string;
  sku: string;
  price: number;
  originalPrice?: number;
  thumbnailUrl: string;
  categorySlug: string;
  quantity: number;
  variantId?: string;
  specs?: {
    socket?: string; // e.g. "LGA1700", "AM5", "AM4"
    ramType?: string; // "DDR4", "DDR5"
    tdpWatt?: number; // Estimated power draw in Watts
    wattage?: number; // For PSU: nominal wattage e.g. 750
    formFactor?: string; // ATX, Micro-ATX, Mini-ITX
    warrantyMonths?: number;
  };
}

export interface CompatibilityIssue {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export interface PrebuiltConfig {
  id: string;
  name: string;
  targetUser: string;
  estimatedPrice: number;
  badge: string;
  description: string;
  parts: Partial<Record<ComponentSlotId, SelectedPart>>;
}
