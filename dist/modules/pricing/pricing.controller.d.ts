import { RoutingService } from '../routing/routing.service';
import { QuoteDto } from './dto/quote.dto';
import { PricingService } from './pricing.service';
export declare class PricingController {
    private readonly pricing;
    private readonly routing;
    constructor(pricing: PricingService, routing: RoutingService);
    quote(dto: QuoteDto): Promise<import("./pricing.service").FareQuote>;
}
