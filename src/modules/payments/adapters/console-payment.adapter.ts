import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentProviderAdapter } from './payment-provider.adapter';
import { InitiateCollectionDto } from '../dto/initiate-collection.dto';
import { PaymentStatus } from '../entities/payment-transaction.entity';

/**
 * Console/Fake payment adapter for development and testing.
 * 
 * ⚠️ WARNING: This adapter must NEVER be used in production.
 * It simulates payment flows without actually moving money.
 * 
 * In production, configure a real provider adapter (Orange Money, Wave, etc.)
 * via the PAYMENT_PROVIDER environment variable.
 */
@Injectable()
export class ConsolePaymentAdapter implements PaymentProviderAdapter {
  private readonly logger = new Logger(ConsolePaymentAdapter.name);
  readonly name = 'console';

  // In-memory store for simulated transactions (dev only)
  private readonly transactions = new Map<
    string,
    {
      providerReference: string;
      status: PaymentStatus;
      initiatedAt: Date;
      amount: number;
      phone: string;
    }
  >();

  constructor(private readonly config: ConfigService) {
    if (config.get('NODE_ENV') === 'production') {
      this.logger.error(
        'ConsolePaymentAdapter MUST NOT be used in production! ' +
        'Configure a real payment provider via PAYMENT_PROVIDER env var.',
      );
    }
  }

  private generateProviderRef(): string {
    return `CONSOLE_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private hashPayload(payload: Record<string, unknown>): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  async initiateCollection(dto: InitiateCollectionDto): Promise<{
    providerReference: string;
    status: PaymentStatus;
    initiatedAt: Date;
    rawResponse?: Record<string, unknown>;
  }> {
    this.logger.log(`[CONSOLE] Initiate collection: ${dto.amount} XOF to ${dto.phone}`);

    const providerReference = this.generateProviderRef();
    const initiatedAt = new Date();

    // Simulate: 90% success rate for dev
    const status = Math.random() < 0.9 ? PaymentStatus.PROCESSING : PaymentStatus.FAILED;

    this.transactions.set(providerReference, {
      providerReference,
      status,
      initiatedAt,
      amount: dto.amount,
      phone: dto.phone,
    });

    // Auto-complete after a short delay for dev UX
    if (status === PaymentStatus.PROCESSING) {
      setTimeout(() => {
        const tx = this.transactions.get(providerReference);
        if (tx && tx.status === PaymentStatus.PROCESSING) {
          tx.status = PaymentStatus.PAID;
          this.logger.log(`[CONSOLE] Auto-completed: ${providerReference}`);
        }
      }, 2000);
    }

    return {
      providerReference,
      status,
      initiatedAt,
      rawResponse: { simulated: true, idempotencyKey: dto.idempotencyKey },
    };
  }

  async queryTransaction(providerReference: string): Promise<{
    status: PaymentStatus;
    completedAt?: Date;
    rawResponse?: Record<string, unknown>;
  }> {
    const tx = this.transactions.get(providerReference);
    if (!tx) {
      return { status: PaymentStatus.FAILED, rawResponse: { error: 'Not found' } };
    }
    return {
      status: tx.status,
      completedAt: tx.status === PaymentStatus.PAID ? new Date() : undefined,
      rawResponse: { simulated: true },
    };
  }

  async refundCollection(
    providerReference: string,
    amount: number,
  ): Promise<{
    providerReference: string;
    status: PaymentStatus;
    completedAt?: Date;
    rawResponse?: Record<string, unknown>;
  }> {
    this.logger.log(`[CONSOLE] Refund: ${amount} XOF for ${providerReference}`);

    const tx = this.transactions.get(providerReference);
    if (!tx || tx.status !== PaymentStatus.PAID) {
      return {
        providerReference,
        status: PaymentStatus.FAILED,
        rawResponse: { error: 'Transaction not refundable' },
      };
    }

    const refundRef = `REFUND_${providerReference}`;
    this.transactions.set(refundRef, {
      providerReference: refundRef,
      status: PaymentStatus.REFUNDED,
      initiatedAt: new Date(),
      amount,
      phone: tx.phone,
    });

    return {
      providerReference: refundRef,
      status: PaymentStatus.REFUNDED,
      completedAt: new Date(),
      rawResponse: { simulated: true },
    };
  }

  async initiatePayout(
    phone: string,
    amount: number,
    idempotencyKey: string,
  ): Promise<{
    providerReference: string;
    status: PaymentStatus;
    initiatedAt: Date;
    rawResponse?: Record<string, unknown>;
  }> {
    this.logger.log(`[CONSOLE] Initiate payout: ${amount} XOF to ${phone}`);

    const providerReference = `PAYOUT_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const initiatedAt = new Date();

    // Simulate: 95% success rate for payouts
    const status = Math.random() < 0.95 ? PaymentStatus.PROCESSING : PaymentStatus.FAILED;

    this.transactions.set(providerReference, {
      providerReference,
      status,
      initiatedAt,
      amount,
      phone,
    });

    if (status === PaymentStatus.PROCESSING) {
      setTimeout(() => {
        const tx = this.transactions.get(providerReference);
        if (tx && tx.status === PaymentStatus.PROCESSING) {
          tx.status = PaymentStatus.PAID;
          this.logger.log(`[CONSOLE] Payout completed: ${providerReference}`);
        }
      }, 3000);
    }

    return {
      providerReference,
      status,
      initiatedAt,
      rawResponse: { simulated: true, idempotencyKey },
    };
  }

  async verifyAndNormalizeCallback(
    payload: Record<string, unknown>,
    _headers: Record<string, string>,
  ): Promise<{
    providerEventId: string;
    providerReference: string;
    providerStatus: string;
    normalizedStatus: PaymentStatus;
    signatureValid: boolean;
    payloadHash: string;
    sanitizedPayload: Record<string, unknown>;
  }> {
    // In console mode, we accept any callback as valid for testing
    const providerReference = (payload['transaction_id'] as string) ??
      (payload['reference'] as string) ??
      this.generateProviderRef();
    const providerStatus = (payload['status'] as string) ?? 'UNKNOWN';
    const providerEventId = (payload['event_id'] as string) ??
      `EVT_${Date.now()}`;

    // Normalize common provider statuses
    let normalizedStatus: PaymentStatus;
    switch (providerStatus.toUpperCase()) {
      case 'SUCCESS':
      case 'COMPLETED':
      case 'PAID':
        normalizedStatus = PaymentStatus.PAID;
        break;
      case 'PENDING':
      case 'PROCESSING':
        normalizedStatus = PaymentStatus.PROCESSING;
        break;
      case 'FAILED':
      case 'DECLINED':
      case 'ERROR':
        normalizedStatus = PaymentStatus.FAILED;
        break;
      case 'REFUNDED':
        normalizedStatus = PaymentStatus.REFUNDED;
        break;
      default:
        normalizedStatus = PaymentStatus.FAILED;
    }

    return {
      providerEventId,
      providerReference,
      providerStatus,
      normalizedStatus,
      signatureValid: true, // Console mode: always valid
      payloadHash: this.hashPayload(payload),
      sanitizedPayload: {
        ...payload,
        // Never store raw credentials/PINs
        pin: undefined,
        password: undefined,
        secret: undefined,
      },
    };
  }
}