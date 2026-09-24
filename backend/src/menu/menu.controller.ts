import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MenuCatalog } from './menu.catalog';
import { DONENESS_LEVELS } from './menu.types';

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly catalog: MenuCatalog) {}

  @Get()
  @ApiOperation({ summary: 'ดูเมนูทั้งหมดแยกหมวด และระดับความสุก' })
  getMenu() {
    return {
      meats: this.catalog.getByCategory('meat'),
      veggies: this.catalog.getByCategory('veggie'),
      noodles: this.catalog.getByCategory('noodle'),
      sauces: this.catalog.getByCategory('sauce'),
      doneness: DONENESS_LEVELS,
    };
  }
}
