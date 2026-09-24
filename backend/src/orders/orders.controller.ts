import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { ModifyOrderDto } from './dto/modify-order.dto';
import { OrdersService } from './orders.service';
import { SignatureSetRegistry } from './signature-set.registry';

// controller เดียวดูแลทั้ง /orders และ /sets จึงใส่ @ApiTags ที่ระดับ method
// ทุก endpoint ต้อง login ก่อน (AuthGuard) ยกเว้น GET /sets ที่ให้ดูเซ็ตได้ก่อนเข้าระบบ
@Controller()
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly sets: SignatureSetRegistry,
  ) {}

  // ---------- จัดชุดเอง (Builder) ----------
  @Post('orders')
  @ApiTags('orders')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'จัดชุดเอง (Builder)' })
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  @Post('orders/custom') // เส้นทางเดิม เก็บไว้ไม่ให้ของเก่าพัง
  @ApiTags('orders')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'จัดชุดเอง เส้นทางเดิม ทำงานเหมือน POST /orders (Builder)', deprecated: true })
  createCustom(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  @Get('orders')
  @ApiTags('orders')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดูประวัติออเดอร์ ใหม่สุดก่อน' })
  findAll() {
    return this.orders.findAll();
  }

  // ---------- แก้ไขออเดอร์ (Prototype + Builder) ----------
  @Patch('orders/:id')
  @ApiTags('orders')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'แก้ไขออเดอร์ ได้ id เดิม (Prototype + Builder)' })
  update(@Param('id') id: string, @Body() mods: ModifyOrderDto) {
    return this.orders.update(id, mods);
  }

  // ---------- ลบประวัติ ----------
  @Delete('orders/:id')
  @HttpCode(204)
  @ApiTags('orders')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ลบออเดอร์ 1 รายการ' })
  remove(@Param('id') id: string): void {
    this.orders.remove(id);
  }

  @Delete('orders')
  @ApiTags('orders')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ล้างประวัติออเดอร์ทั้งหมด เซ็ตแนะนำไม่ได้รับผลกระทบ' })
  clear() {
    return { deleted: this.orders.clear() };
  }

  // ---------- สั่งซ้ำ (Prototype) ----------
  @Post('orders/:id/clone')
  @ApiTags('orders')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'สั่งซ้ำ (Prototype)' })
  repeat(@Param('id') id: string) {
    return this.orders.repeat(id);
  }

  // ---------- เซ็ตเมนูแนะนำ (Prototype + Builder) ----------
  @Get('sets')
  @ApiTags('sets')
  @ApiOperation({ summary: 'ดูเซ็ตเมนูแนะนำ (Prototype)' })
  listSets() {
    return this.sets.list();
  }

  @Post('sets/:setId/order')
  @ApiTags('sets')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'สั่งเซ็ต ปรับได้ ส่ง body ว่างคือสั่งตามเดิม (Prototype + Builder)' })
  orderFromSet(@Param('setId') setId: string, @Body() mods: ModifyOrderDto) {
    return this.orders.orderFromSet(setId, mods);
  }
}
