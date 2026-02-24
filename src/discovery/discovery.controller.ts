import { Controller, Get, Query } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get()
  findAll(@Query('city') city?: string, @Query('category') category?: string) {
    return this.discoveryService.findAll(city, category);
  }
}
