import { MerchantStatus, MerchantType } from '../entities/merchant.entity';

export interface MerchantPublicDto {
  id: string; name: string; type: MerchantType;
  phone: string | null; address: string | null; logoUrl: string | null; coverUrl: string | null;
  description: string | null; acceptingOrders: boolean; deliveryFee: number;
  minimumOrderAmount: number; estimatedDeliveryMinutes: number; ratingAvg: number;
  ratingCount: number; isFavorite: boolean; lat: number | null; lng: number | null; status: MerchantStatus;
}

export interface ProductPublicDto {
  id: string; merchantId: string; categoryId: string; name: string; description: string | null;
  price: number; imageUrl: string | null; trackInventory: boolean; isAvailable: boolean; sortOrder: number;
}

export interface ProductOwnerDto extends ProductPublicDto { stockQuantity: number | null; }

export interface MerchantCatalogDto {
  merchant: MerchantPublicDto;
  categories: Array<Record<string, unknown>>;
  promotions: Array<Record<string, unknown>>;
}
