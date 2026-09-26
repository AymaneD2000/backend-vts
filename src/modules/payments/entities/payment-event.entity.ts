import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentTransaction } from './payment-transaction.entity';

@Entity('payment_events')
export class PaymentEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'transaction_id', type: 'uuid' })
  transactionId: string;

  @ManyToOne(() => PaymentTransaction, (t) => t.events, { onDelete: 'CASCADE' })
  transaction: PaymentTransaction;

  @Column({ name: 'provider', length: 50 })
  provider: string;

  @Column({ name: 'provider_event_id', length: 100 })
  providerEventId: string;

  @Column({ name: 'provider_status', length: 50 })
  providerStatus: string;

  @Column({ name: 'normalized_status', length: 50 })
  normalizedStatus: string;

  @Column({ name: 'signature_valid', default: false })
  signatureValid: boolean;

  @Column({ name: 'payload_hash', length: 64 })
  payloadHash: string;

  @Column({ name: 'sanitized_payload', type: 'jsonb', nullable: true })
  sanitizedPayload?: Record<string, unknown>;

  @CreateDateColumn({ name: 'received_at' })
  receivedAt: Date;
}