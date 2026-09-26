import { Merchant } from './entities/merchant.entity';
import { Product } from './entities/product.entity';
import { MerchantPublicDto, ProductOwnerDto, ProductPublicDto } from './dto/merchant-response.dto';

export function effectiveProductAvailability(product: Pick<Product, 'isAvailable' | 'trackInventory' | 'stockQuantity'>): boolean {
  return Boolean(product.isAvailable) && (!product.trackInventory || (product.stockQuantity ?? 0) > 0);
}

export class MerchantPresenter {
  publicMerchant(merchant: Merchant, isFavorite = false): MerchantPublicDto {
    return {
      id: merchant.id, name: merchant.name, type: merchant.type,
      phone: merchant.phone ?? null, address: merchant.address ?? null,
      logoUrl: merchant.logoUrl ?? null, coverUrl: merchant.coverUrl ?? null,
      description: merchant.description ?? null, acceptingOrders: merchant.acceptingOrders ?? true,
      deliveryFee: Number(merchant.deliveryFee ?? 0), minimumOrderAmount: Number(merchant.minimumOrderAmount ?? 0),
      estimatedDeliveryMinutes: Number(merchant.estimatedDeliveryMinutes ?? 30),
      ratingAvg: Number(merchant.ratingAvg ?? 0), ratingCount: Number(merchant.ratingCount ?? 0),
      isFavorite, lat: merchant.lat ?? null, lng: merchant.lng ?? null, status: merchant.status,
    };
  }

  publicProduct(product: Product): ProductPublicDto {
    return {
      id: product.id, merchantId: product.merchantId, categoryId: product.categoryId,
      name: product.name, description: product.description ?? null, price: Number(product.price),
      imageUrl: product.imageUrl ?? null, trackInventory: Boolean(product.trackInventory),
      isAvailable: effectiveProductAvailability(product), sortOrder: Number(product.sortOrder ?? 0),
    };
  }

  ownerProduct(product: Product): ProductOwnerDto {
    return { ...this.publicProduct(product), stockQuantity: product.stockQuantity ?? null };
  }
}
