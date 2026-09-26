import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentProviderAdapter } from './adapters/payment-provider.adapter';
import { ConsolePaymentAdapter } from './adapters/console-payment.adapter';
import { PaymentTransaction, PaymentDirection, PaymentStatus } from './entities/payment-transaction.entity';
import { PaymentEvent } from './entities/payment-event.entity';
import { InitiateCollectionDto } from './dto/initiate-collection.dto';

export interface PaymentCallbackResult {
  transaction: PaymentTransaction;
  event: PaymentEvent;
  isNewEvent: boolean;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly provider: PaymentProviderAdapter;

  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly transactions: Repository<PaymentTransaction>,
    @InjectRepository(PaymentEvent)
    private readonly events: Repository<PaymentEvent>,
    private readonly config: ConfigService,
  ) {
    // Use console adapter by default; real providers inject their own
    this.provider = new ConsolePaymentAdapter(config);
  }

  /** Set a custom provider adapter (for real integrations) */
  setProvider(provider: PaymentProviderAdapter): void {
    // This is intentionally not in constructor to allow dynamic switching
    // In production, wire this via module configuration
    (this as any).provider = provider;
  }

  // ============ Collection (Customer Pays) ============

  async initiateCollection(
    userId: string,
    dto: InitiateCollectionDto,
  ): Promise<PaymentTransaction> {
    // Check idempotency
    const existing = await this.transactions.findOne({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing) {
      if (existing.userId !== userId) {
        throw new ConflictException('Idempotency key belongs to another user');
      }
      return existing;
    }

    // Create transaction record
    const transaction = this.transactions.create({
      userId,
      orderId: dto.orderId,
      rideId: dto.rideId,
      direction: PaymentDirection.COLLECTION,
      provider: this.provider.name,
      idempotencyKey: dto.idempotencyKey,
      amount: dto.amount,
      currency: 'XOF',
      destinationPhone: dto.phone,
      status: PaymentStatus.PENDING,
    });
    await this.transactions.save(transaction);

    // Call provider
    try {
      const result = await this.provider.initiateCollection(dto);

      transaction.providerReference = result.providerReference;
      transaction.status = result.status;
      transaction.initiatedAt = result.initiatedAt;
      await this.transactions.save(transaction);

      this.logger.log(
        `Collection initiated: ${transaction.id} via ${this.provider.name} ` +
        `(${result.status}) - ${dto.amount} XOF`,
      );

      return transaction;
    } catch (error) {
      transaction.status = PaymentStatus.FAILED;
      transaction.failureCode = 'PROVIDER_ERROR';
      await this.transactions.save(transaction);
      this.logger.error('Provider initiateCollection failed', error);
      throw new BadRequestException('Payment initiation failed');
    }
  }

  async queryTransaction(transactionId: string): Promise<PaymentTransaction> {
    const transaction = await this.transactions.findOne({
      where: { id: transactionId },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');

    // Query provider for latest status
    if (transaction.providerReference) {
      try {
        const result = await this.provider.queryTransaction(
          transaction.providerReference,
        );
        if (result.status !== transaction.status) {
          transaction.status = result.status;
          if (
            result.status === PaymentStatus.PAID ||
            result.status === PaymentStatus.FAILED
          ) {
            transaction.completedAt = result.completedAt ?? new Date();
          }
          await this.transactions.save(transaction);
        }
      } catch (error) {
        this.logger.warn(
          `Provider query failed for ${transactionId}: ${error}`,
        );
      }
    }
    return transaction;
  }

  async refundCollection(
    transactionId: string,
    amount: number,
    userId: string,
  ): Promise<PaymentTransaction> {
    const original = await this.transactions.findOne({
      where: { id: transactionId },
    });
    if (!original) throw new NotFoundException('Transaction not found');
    if (original.userId !== userId)
      throw new ConflictException('Not your transaction');
    if (original.status !== PaymentStatus.PAID)
      throw new ConflictException('Only paid transactions can be refunded');
    if (amount > original.amount)
      throw new BadRequestException('Refund amount exceeds original');

    // Check if already refunded
    const existingRefund = await this.transactions.findOne({
      where: { parentTransactionId: original.id, direction: PaymentDirection.REFUND },
    });
    if (existingRefund) throw new ConflictException('Already refunded');

    const refund = this.transactions.create({
      userId,
      orderId: original.orderId,
      rideId: original.rideId,
      direction: PaymentDirection.REFUND,
      provider: original.provider,
      idempotencyKey: `REFUND_${original.idempotencyKey}`,
      amount,
      currency: original.currency,
      destinationPhone: original.destinationPhone,
      status: PaymentStatus.REFUND_PENDING,
      parentTransactionId: original.id,
    });
    await this.transactions.save(refund);

    try {
      const result = await this.provider.refundCollection(
        original.providerReference!,
        amount,
      );
      refund.providerReference = result.providerReference;
      refund.status = result.status;
      refund.completedAt = result.completedAt ?? new Date();
      await this.transactions.save(refund);
      return refund;
    } catch (error) {
      refund.status = PaymentStatus.FAILED;
      refund.failureCode = 'PROVIDER_ERROR';
      await this.transactions.save(refund);
      throw new BadRequestException('Refund failed');
    }
  }

  // ============ Payout (Driver Withdrawal) ============

  async initiatePayout(
    userId: string,
    phone: string,
    amount: number,
    idempotencyKey: string,
  ): Promise<PaymentTransaction> {
    // Check idempotency
    const existing = await this.transactions.findOne({
      where: { idempotencyKey },
    });
    if (existing) return existing;

    const transaction = this.transactions.create({
      userId,
      direction: PaymentDirection.PAYOUT,
      provider: this.provider.name,
      idempotencyKey,
      amount,
      currency: 'XOF',
      destinationPhone: phone,
      status: PaymentStatus.PENDING,
    });
    await this.transactions.save(transaction);

    try {
      const result = await this.provider.initiatePayout(phone, amount, idempotencyKey);

      transaction.providerReference = result.providerReference;
      transaction.status = result.status;
      transaction.initiatedAt = result.initiatedAt;
      await this.transactions.save(transaction);

      this.logger.log(
        `Payout initiated: ${transaction.id} via ${this.provider.name} ` +
        `(${result.status}) - ${amount} XOF`,
      );

      return transaction;
    } catch (error) {
      transaction.status = PaymentStatus.FAILED;
      transaction.failureCode = 'PROVIDER_ERROR';
      await this.transactions.save(transaction);
      throw new BadRequestException('Payout initiation failed');
    }
  }

  // ============ Provider Callback / Webhook ============

  async handleCallback(
    payload: Record<string, unknown>,
    headers: Record<string, string>,
  ): Promise<PaymentCallbackResult> {
    // Verify and normalize
    const normalized = await this.provider.verifyAndNormalizeCallback(payload, headers);

    // Find transaction by provider reference
    const transaction = await this.transactions.findOne({
      where: { providerReference: normalized.providerReference },
    });
    if (!transaction) {
      this.logger.warn(
        `Callback for unknown transaction: ${normalized.providerReference}`,
      );
      throw new NotFoundException('Transaction not found');
    }

    // Check for duplicate event (idempotent callback handling)
    const existingEvent = await this.events.findOne({
      where: {
        provider: this.provider.name,
        providerEventId: normalized.providerEventId,
      },
    });

    if (existingEvent) {
      // Reuse existing event - no duplicate inbox row
      return { transaction, event: existingEvent, isNewEvent: false };
    }

    // Create event record
    const event = this.events.create({
      transactionId: transaction.id,
      provider: this.provider.name,
      providerEventId: normalized.providerEventId,
      providerStatus: normalized.providerStatus,
      normalizedStatus: normalized.normalizedStatus,
      signatureValid: normalized.signatureValid,
      payloadHash: normalized.payloadHash,
      sanitizedPayload: normalized.sanitizedPayload,
    });
    await this.events.save(event);

    // Update transaction status if changed
    if (normalized.normalizedStatus !== transaction.status) {
      transaction.status = normalized.normalizedStatus;
      if (
        normalized.normalizedStatus === PaymentStatus.PAID ||
        normalized.normalizedStatus === PaymentStatus.FAILED
      ) {
        transaction.completedAt = new Date();
      }
      await this.transactions.save(transaction);
    }

    this.logger.log(
      `Callback processed: ${transaction.id} -> ${normalized.normalizedStatus} ` +
      `(event: ${event.id}, new: true)`,
    );

    return { transaction, event, isNewEvent: true };
  }

  // ============ Queries ============

  async getTransaction(transactionId: string, userId: string): Promise<PaymentTransaction> {
    const transaction = await this.transactions.findOne({
      where: { id: transactionId },
      relations: ['events'],
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.userId !== userId)
      throw new ConflictException('Not your transaction');
    return transaction;
  }

  async getUserTransactions(
    userId: string,
    options?: { status?: PaymentStatus; limit?: number },
  ): Promise<PaymentTransaction[]> {
    const qb = this.transactions
      .createQueryBuilder('tx')
      .where('tx.userId = :userId', { userId })
      .orderBy('tx.createdAt', 'DESC')
      .limit(options?.limit ?? 50);

    if (options?.status) {
      qb.andWhere('tx.status = :status', { status: options.status });
    }

    return qb.getMany();
  }

  async getOrderTransactions(orderId: string): Promise<PaymentTransaction[]> {
    return this.transactions.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  async getRideTransactions(rideId: string): Promise<PaymentTransaction[]> {
    return this.transactions.find({
      where: { rideId },
      order: { createdAt: 'DESC' },
    });
  }
}