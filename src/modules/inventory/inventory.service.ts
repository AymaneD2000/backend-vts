import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { ApplicationError, ApplicationErrorCode } from '../../common/application-error';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Product } from '../merchants/entities/product.entity';
import { effectiveProductAvailability } from '../merchants/merchant-presenter';
import { InventoryMovement, InventoryMovementType } from './entities/inventory-movement.entity';
import { SetProductStockDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Merchant) private readonly merchants: Repository<Merchant>,
    @InjectRepository(InventoryMovement) private readonly movements: Repository<InventoryMovement>,
    private readonly dataSource?: DataSource,
  ) {}

  async setStock(actorUserId: string, merchantId: string, productId: string, dto: SetProductStockDto): Promise<Product> {
    if (dto.trackInventory && (!Number.isInteger(dto.stockQuantity) || (dto.stockQuantity ?? -1) < 0)) {
      throw new ApplicationError(HttpStatus.BAD_REQUEST, ApplicationErrorCode.VALIDATION_FAILED, 'La quantité doit être un entier positif ou nul.');
    }
    const merchant = await this.merchants.findOne({ where: { id: merchantId, ownerUserId: actorUserId } });
    if (!merchant) throw new ApplicationError(HttpStatus.NOT_FOUND, ApplicationErrorCode.RESOURCE_NOT_FOUND, 'Marchand introuvable.');
    const product = await this.products.findOne({ where: { id: productId, merchantId } });
    if (!product) throw new ApplicationError(HttpStatus.NOT_FOUND, ApplicationErrorCode.RESOURCE_NOT_FOUND, 'Produit introuvable.');
    const previous = product.trackInventory ? (product.stockQuantity ?? 0) : null;
    product.trackInventory = dto.trackInventory;
    product.stockQuantity = dto.trackInventory ? dto.stockQuantity! : null;
    const saved = await this.products.save(product);
    if (dto.trackInventory && previous !== saved.stockQuantity) {
      const delta = saved.stockQuantity! - (previous ?? 0);
      const idempotencyKey = `adjustment:${productId}:${saved.stockQuantity}:${Date.now()}`;
      await this.movements.save(this.movements.create({ merchantId, productId, actorUserId, type: InventoryMovementType.ADJUSTMENT, quantityDelta: delta, balanceAfter: saved.stockQuantity!, reason: dto.reason, idempotencyKey }));
    }
    return saved;
  }

  async lockProducts(manager: EntityManager, merchantId: string, quantities: ReadonlyMap<string, number>): Promise<Product[]> {
    const ids = [...quantities.keys()].sort();
    if (ids.length === 0) return [];
    const products = await manager.getRepository(Product).find({ where: { id: In(ids), merchantId }, order: { id: 'ASC' }, lock: { mode: 'pessimistic_write' } });
    if (products.length !== ids.length) throw new ApplicationError(HttpStatus.NOT_FOUND, ApplicationErrorCode.RESOURCE_NOT_FOUND, 'Produit introuvable.');
    for (const product of products) {
      const quantity = quantities.get(product.id)!;
      if (product.trackInventory && (!product.isAvailable || (product.stockQuantity ?? 0) < quantity)) {
        throw new ApplicationError(HttpStatus.CONFLICT, ApplicationErrorCode.OUT_OF_STOCK, 'Produit en rupture de stock.');
      }
    }
    return products;
  }

  async reserveLocked(manager: EntityManager, input: { orderId: string; merchantId: string; actorUserId: string; quantities: ReadonlyMap<string, number>; products: Product[] }): Promise<void> {
    const movementRepo = manager.getRepository(InventoryMovement);
    for (const product of input.products) {
      if (!product.trackInventory) continue;
      const quantity = input.quantities.get(product.id)!;
      product.stockQuantity = (product.stockQuantity ?? 0) - quantity;
      await manager.getRepository(Product).save(product);
      const key = `reservation:${input.orderId}:${product.id}`;
      const existing = await movementRepo.findOne({ where: { idempotencyKey: key } });
      if (!existing) await movementRepo.save(movementRepo.create({ merchantId: input.merchantId, productId: product.id, orderId: input.orderId, actorUserId: input.actorUserId, type: InventoryMovementType.ORDER_RESERVATION, quantityDelta: -quantity, balanceAfter: product.stockQuantity!, idempotencyKey: key }));
    }
  }

  async releaseOrder(manager: EntityManager, orderId: string, actorUserId?: string): Promise<void> {
    const rows = await manager.getRepository(InventoryMovement).find({ where: { orderId, type: InventoryMovementType.ORDER_RESERVATION } });
    for (const row of rows) {
      const key = `release:${orderId}:${row.productId}`;
      if (await manager.getRepository(InventoryMovement).findOne({ where: { idempotencyKey: key } })) continue;
      const product = await manager.getRepository(Product).findOne({ where: { id: row.productId }, lock: { mode: 'pessimistic_write' } });
      if (!product || !product.trackInventory) continue;
      product.stockQuantity = (product.stockQuantity ?? 0) + Math.abs(row.quantityDelta);
      await manager.getRepository(Product).save(product);
      await manager.getRepository(InventoryMovement).save(manager.getRepository(InventoryMovement).create({ merchantId: row.merchantId, productId: row.productId, orderId, actorUserId, type: InventoryMovementType.ORDER_RELEASE, quantityDelta: Math.abs(row.quantityDelta), balanceAfter: product.stockQuantity!, idempotencyKey: key }));
    }
  }
}
