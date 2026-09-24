import { Module } from '@nestjs/common';
import { MenuCatalog } from './menu.catalog';
import { MenuController } from './menu.controller';

@Module({
  controllers: [MenuController],
  providers: [MenuCatalog],
  exports: [MenuCatalog],
})
export class MenuModule {}
