import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [AuthModule, MenuModule, OrdersModule],
})
export class AppModule {}
