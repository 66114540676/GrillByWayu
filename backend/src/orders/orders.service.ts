import { Injectable, NotFoundException } from '@nestjs/common';
import { MenuCatalog } from '../menu/menu.catalog';
import { CreateOrderDto } from './dto/create-order.dto';
import { ModifyOrderDto } from './dto/modify-order.dto';
import { GrillOrder } from './grill-order';
import { GrillOrderBuilder } from './grill-order.builder';
import { SignatureSetRegistry } from './signature-set.registry';

@Injectable()
export class OrdersService {
  // Database แบบ In-Memory Array (ปิดเซิร์ฟเวอร์แล้วข้อมูลหาย)
  private readonly orders: GrillOrder[] = [];

  constructor(
    private readonly catalog: MenuCatalog,
    private readonly sets: SignatureSetRegistry,
  ) {}

  // [Builder] ทำหน้าที่ Director: เรียกขั้นตอนของ Builder ตามที่ลูกค้าเลือกมา
  create(dto: CreateOrderDto): GrillOrder {
    const builder = new GrillOrderBuilder(this.catalog);
    dto.meatIds.forEach((id) => builder.addMeat(id));
    if (dto.doneness) builder.setDoneness(dto.doneness);
    dto.veggieIds?.forEach((id) => builder.addVeggie(id));
    dto.noodleIds?.forEach((id) => builder.addNoodle(id));
    if (dto.sauceId) builder.setSauce(dto.sauceId);
    return this.save(builder.build());
  }

  findAll(): GrillOrder[] {
    return [...this.orders].reverse(); // ใหม่สุดก่อน
  }

  findById(id: string): GrillOrder {
    const order = this.orders.find((o) => o.id === id);
    if (!order) throw new NotFoundException(`ไม่พบออเดอร์รหัส "${id}"`);
    return order;
  }

  // ลบเฉพาะประวัติออเดอร์ เซ็ตต้นแบบใน SignatureSetRegistry ไม่เกี่ยว
  remove(id: string): void {
    const index = this.orders.findIndex((o) => o.id === id);
    if (index === -1) throw new NotFoundException(`ไม่พบออเดอร์รหัส "${id}"`);
    this.orders.splice(index, 1);
  }

  clear(): number {
    return this.orders.splice(0).length;
  }

  // [Prototype] สั่งซ้ำ: clone ออเดอร์เดิม ไม่ต้องประกอบใหม่
  repeat(id: string): GrillOrder {
    const copy = this.findById(id).clone();
    copy.markOrigin({ type: 'repeat', fromOrderId: id });
    return this.save(copy);
  }

  // [Prototype + Builder] clone เซ็ตต้นแบบ แล้วใช้ Builder ปรับเฉพาะส่วนที่ลูกค้าอยากเปลี่ยน
  orderFromSet(setId: string, mods: ModifyOrderDto = {}): GrillOrder {
    const { info, order } = this.sets.get(setId);
    const builder = this.applyMods(GrillOrderBuilder.from(order, this.catalog), mods);

    const result = builder.build(); // ปรับแล้วต้องผ่านกฎของร้านเหมือนเดิม
    result.markOrigin({ type: 'set', setId, setName: info.name });
    return this.save(result);
  }

  // [Prototype + Builder] แก้ไขออเดอร์: clone ตัวเดิม → ปรับด้วย Builder → build() ให้ได้ id เดิม
  // ไม่แก้ field ของ GrillOrder ตรงๆ ถ้า build() ไม่ผ่านกฎ array จะไม่ถูกแตะเลย
  update(id: string, mods: ModifyOrderDto = {}): GrillOrder {
    const index = this.orders.findIndex((o) => o.id === id);
    if (index === -1) throw new NotFoundException(`ไม่พบออเดอร์รหัส "${id}"`);
    const original = this.orders[index];

    const builder = this.applyMods(GrillOrderBuilder.from(original.clone(), this.catalog), mods);
    const updated = builder.build(original);
    this.orders[index] = updated; // แทนที่ตำแหน่งเดิม ลำดับในประวัติจึงไม่เปลี่ยน
    return updated;
  }

  private applyMods(builder: GrillOrderBuilder, mods: ModifyOrderDto): GrillOrderBuilder {
    mods.removeMeatIds?.forEach((id) => builder.removeMeat(id));
    mods.addMeatIds?.forEach((id) => builder.addMeat(id));
    mods.removeVeggieIds?.forEach((id) => builder.removeVeggie(id));
    mods.addVeggieIds?.forEach((id) => builder.addVeggie(id));
    mods.removeNoodleIds?.forEach((id) => builder.removeNoodle(id));
    mods.addNoodleIds?.forEach((id) => builder.addNoodle(id));
    if (mods.sauceId) builder.setSauce(mods.sauceId);
    if (mods.doneness) builder.setDoneness(mods.doneness);
    return builder;
  }

  private save(order: GrillOrder): GrillOrder {
    this.orders.push(order);
    return order;
  }
}
