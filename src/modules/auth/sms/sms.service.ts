import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Pluggable SMS sender. In dev (provider=console) the code is logged instead
// of sent, so the flow can be tested without a paid SMS gateway.
// Africa's Talking / Twilio / local aggregator can be implemented here later.
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService) {}

  async send(phone: string, message: string): Promise<void> {
    const provider = this.config.get<string>('otp.smsProvider');
    if (provider === 'console') {
      this.logger.log(`[SMS:console] to ${phone}: ${message}`);
      return;
    }
    // TODO: implement africastalking / twilio providers.
    this.logger.warn(
      `SMS provider "${provider}" not implemented; message to ${phone} dropped.`,
    );
  }
}
