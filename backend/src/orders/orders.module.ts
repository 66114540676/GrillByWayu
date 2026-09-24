import { Module } from '@nestjs/common';
import { MenuModule } from '../menu/menu.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { SignatureSetRegistry } from './signature-set.registry';

@Module({
  imports: [MenuModule],
  controllers: [OrdersController],
  providers: [OrdersService, SignatureSetRegistry],
})
export class OrdersModule {}
