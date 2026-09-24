import { Controller, Get } from '@nestjs/common';
import { MenuCatalog } from './menu.catalog';
import { DONENESS_LEVELS } from './menu.types';

@Controller('menu')
export class MenuController {
  constructor(private readonly catalog: MenuCatalog) {}

  @Get()
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
