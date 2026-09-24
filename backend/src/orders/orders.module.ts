import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MenuModule } from '../menu/menu.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { SignatureSetRegistry } from './signature-set.registry';

@Module({
  imports: [MenuModule, AuthModule], // AuthModule: ให้ AuthGuard ใน OrdersController ใช้ AuthService ได้
  controllers: [OrdersController],
  providers: [OrdersService, SignatureSetRegistry],
})
export class OrdersModule {}
