import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import { IntelligenceService } from './intelligence.service';
import { CreateIntelligenceDto } from './dto/create-intelligence.dto';

@Controller('intelligence')
export class IntelligenceController {
  private readonly logger = new Logger(IntelligenceController.name);

  constructor(private readonly intelligenceService: IntelligenceService) {}

  /**
   * GET /intelligence/user/:userId/trip/:tripId
   * Triggers the Powerful Algorithm for a specific trip plan, scoped to a user.
   */
  @Get('user/:userId/trip/:tripId')
  async getInsights(
    @Param('userId') userId: string,
    @Param('tripId') tripId: string,
    @Query('userLocation') userLocation?: string,
  ) {
    this.logger.log(
      `Triggering intelligent insights for user: ${userId}, trip: ${tripId}`,
    );
    return this.intelligenceService.generateIntelligentInsights(
      +userId,
      +tripId,
      userLocation,
    );
  }

  @Post()
  create(@Body() createDto: CreateIntelligenceDto) {
    return this.intelligenceService.create(createDto);
  }

  @Get()
  findAll() {
    return this.intelligenceService.findAll();
  }
}
