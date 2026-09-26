import { InitiateCollectionDto } from '../dto/initiate-collection.dto';
import { PaymentStatus } from '../entities/payment-transaction.entity';

export interface PaymentProviderAdapter {
  /** Provider identifier (e.g., 'orange_money', 'wave', 'console') */
  readonly name: string;

  /**
   * Initiate a collection (customer pays) request.
   * Returns provider-specific transaction reference.
   */
  initiateCollection(dto: InitiateCollectionDto): Promise<{
    providerReference: string;
    status: PaymentStatus;
    initiatedAt: Date;
    rawResponse?: Record<string, unknown>;
  }>;

  /**
   * Query the status of a transaction by provider reference.
   */
  queryTransaction(providerReference: string): Promise<{
    status: PaymentStatus;
    completedAt?: Date;
    rawResponse?: Record<string, unknown>;
  }>;

  /**
   * Refund a previously completed collection.
   */
  refundCollection(providerReference: string, amount: number): Promise<{
    providerReference: string;
    status: PaymentStatus;
    completedAt?: Date;
    rawResponse?: Record<string, unknown>;
  }>;

  /**
   * Initiate a payout (driver withdrawal) to a phone number.
   */
  initiatePayout(
    phone: string,
    amount: number,
    idempotencyKey: string,
  ): Promise<{
    providerReference: string;
    status: PaymentStatus;
    initiatedAt: Date;
    rawResponse?: Record<string, unknown>;
  }>;

  /**
   * Verify and normalize an incoming provider callback/webhook.
   * Returns the normalized status and the sanitized payload for storage.
   */
  verifyAndNormalizeCallback(
    payload: Record<string, unknown>,
    headers: Record<string, string>,
  ): Promise<{
    providerEventId: string;
    providerReference: string;
    providerStatus: string;
    normalizedStatus: PaymentStatus;
    signatureValid: boolean;
    payloadHash: string;
    sanitizedPayload: Record<string, unknown>;
  }>;
}