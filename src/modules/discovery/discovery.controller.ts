import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DiscoveryService } from './discovery.service';
import {
  ActivityQueryDto,
  FeedQueryDto,
  SearchQueryDto,
} from './dto/discovery-query.dto';

// Customer-facing aggregation (BFF) surfaces for the super-app home, global
// search and unified orders center. Read-only fan-out over existing verticals.
@UseGuards(JwtAuthGuard)
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Get('feed')
  feed(@Query() query: FeedQueryDto) {
    return this.discovery.feed(query);
  }

  @Get('search')
  search(@Query() query: SearchQueryDto) {
    return this.discovery.search(query);
  }

  @Get('activity')
  activity(
    @CurrentUser('userId') userId: string,
    @Query() query: ActivityQueryDto,
  ) {
    return this.discovery.activity(userId, query);
  }
}
