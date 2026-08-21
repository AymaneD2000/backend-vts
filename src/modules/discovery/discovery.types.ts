// Shared response shapes for the discovery (BFF) surfaces. These are the
// contracts the mobile client consumes; keep them stable and additive.

// --- Feed ---

export interface FeedPreviewProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
}

// A merchant card in the nearby feed. The feed is a discriminated union on
// `type` so rentals/promotions can be interleaved in a later milestone without
// breaking existing clients.
export interface MerchantFeedItem {
  type: 'merchant';
  id: string;
  name: string;
  logoUrl: string | null;
  category: string;
  distanceMeters: number;
  rating?: number;
  offerBadge?: string;
  previewProducts: FeedPreviewProduct[];
}

// Future: | RentalFeedItem | PromotionFeedItem
export type FeedItem = MerchantFeedItem;

export interface FeedResponse {
  items: FeedItem[];
  nextCursor: string | null;
}

// Opaque cursor payload for the feed (stable ordering by distance then id).
export interface FeedCursor {
  distance: number;
  id: string;
}

// --- Search ---

export interface SearchMerchantRow {
  id: string;
  name: string;
  logoUrl: string | null;
  category: string;
  distanceMeters: number | null;
}

export interface SearchDishRow {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  merchantId: string;
  merchantName: string | null;
}

export interface SearchRentalRow {
  id: string;
  name: string;
  category: string;
  dailyPrice: number;
  imageUrl: string | null;
}

export interface SearchResults {
  merchants: SearchMerchantRow[];
  dishes: SearchDishRow[];
  rentals: SearchRentalRow[];
}

// --- Activity (unified orders timeline) ---

export type ActivityType = 'ride' | 'food' | 'rental';

export type ActivityStatusColor =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export interface ActivityItem {
  type: ActivityType;
  id: string;
  title: string;
  statusLabel: string;
  statusColor: ActivityStatusColor;
  createdAt: string;
  amountLabel: string;
  deepLink: string;
}

export interface ActivityResponse {
  items: ActivityItem[];
  nextCursor: string | null;
}

// Opaque cursor payload for the activity timeline (createdAt desc, then
// type/id for a stable total order).
export interface ActivityCursor {
  createdAt: string;
  type: ActivityType;
  id: string;
}
