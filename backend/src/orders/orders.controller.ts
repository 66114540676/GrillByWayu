import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { ModifyOrderDto } from './dto/modify-order.dto';
import { OrdersService } from './orders.service';
import { SignatureSetRegistry } from './signature-set.registry';

@Controller()
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly sets: SignatureSetRegistry,
  ) {}

  // ---------- จัดชุดเอง (Builder) ----------
  @Post('orders')
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  @Post('orders/custom') // เส้นทางเดิม เก็บไว้ไม่ให้ของเก่าพัง
  createCustom(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  @Get('orders')
  findAll() {
    return this.orders.findAll();
  }

  // ---------- แก้ไขออเดอร์ (Prototype + Builder) ----------
  @Patch('orders/:id')
  update(@Param('id') id: string, @Body() mods: ModifyOrderDto) {
    return this.orders.update(id, mods);
  }

  // ---------- ลบประวัติ ----------
  @Delete('orders/:id')
  @HttpCode(204)
  remove(@Param('id') id: string): void {
    this.orders.remove(id);
  }

  @Delete('orders')
  clear() {
    return { deleted: this.orders.clear() };
  }

  // ---------- สั่งซ้ำ (Prototype) ----------
  @Post('orders/:id/clone')
  repeat(@Param('id') id: string) {
    return this.orders.repeat(id);
  }

  // ---------- เซ็ตเมนูแนะนำ (Prototype + Builder) ----------
  @Get('sets')
  listSets() {
    return this.sets.list();
  }

  @Post('sets/:setId/order')
  orderFromSet(@Param('setId') setId: string, @Body() mods: ModifyOrderDto) {
    return this.orders.orderFromSet(setId, mods);
  }
}
