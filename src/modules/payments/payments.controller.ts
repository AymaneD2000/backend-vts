import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService, PaymentCallbackResult } from './payments.service';
import { InitiateCollectionDto } from './dto/initiate-collection.dto';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  // ============ Customer: Initiate Payment ============

  @Post('collection')
  async initiateCollection(
    @CurrentUser('userId') userId: string,
    @Body() dto: InitiateCollectionDto,
  ) {
    return this.payments.initiateCollection(userId, dto);
  }

  @Get('transactions/:id')
  async getTransaction(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.payments.getTransaction(id, userId);
  }

  @Get('transactions')
  async getUserTransactions(
    @CurrentUser('userId') userId: string,
  ) {
    return this.payments.getUserTransactions(userId);
  }

  @Post('transactions/:id/refund')
  async refund(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body('amount') amount: number,
  ) {
    return this.payments.refundCollection(id, amount, userId);
  }

  // ============ Driver: Payout ============

  @Post('payout')
  async initiatePayout(
    @CurrentUser('userId') userId: string,
    @Body() body: { phone: string; amount: number; idempotencyKey: string },
  ) {
    return this.payments.initiatePayout(
      userId,
      body.phone,
      body.amount,
      body.idempotencyKey,
    );
  }

  // ============ Provider Callback (Webhook) ============
  // Note: This endpoint is PUBLIC (no auth) - called by payment providers

  @Post('callback/:provider')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'application/json')
  async handleCallback(
    @Param('provider') provider: string,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ received: boolean; eventId: string }> {
    // Parse raw body
    const rawBody = req.rawBody?.toString('utf8') ?? '';
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = { raw: rawBody };
    }

    // Normalize headers
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') headers[key.toLowerCase()] = value;
    }

    const result = await this.payments.handleCallback(payload, headers);
    return { received: true, eventId: result.event.id };
  }
}