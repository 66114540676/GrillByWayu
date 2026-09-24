import { BadRequestException } from '@nestjs/common';
import { MenuCatalog } from '../menu/menu.catalog';
import { DONENESS_LEVELS, Doneness, MenuItem } from '../menu/menu.types';
import { GrillOrder } from './grill-order';

// [Builder: Concrete Builder]
// ประกอบออเดอร์หมูกระทะทีละขั้น แล้วสร้าง GrillOrder ที่ถูกต้องตามกฎของร้านใน build()
// ไม่ได้ลงทะเบียนเป็น provider เพราะ Builder เก็บสถานะของออเดอร์ที่กำลังประกอบ ต้องสร้างใหม่ทุกออเดอร์
export class GrillOrderBuilder {
  private meats: MenuItem[] = [];
  private doneness?: Doneness;
  private veggies: MenuItem[] = [];
  private noodles: MenuItem[] = [];
  private sauce?: MenuItem;

  constructor(private readonly catalog: MenuCatalog) {}

  // [Builder + Prototype] เริ่มประกอบจากออเดอร์ที่มีอยู่แล้ว (เช่น เซ็ตที่ clone มา) แล้วปรับต่อ
  static from(order: GrillOrder, catalog: MenuCatalog): GrillOrderBuilder {
    return new GrillOrderBuilder(catalog).loadFrom(order);
  }

  loadFrom(order: GrillOrder): this {
    const parts = order.getParts();
    this.meats = parts.meats;
    this.doneness = parts.doneness;
    this.veggies = parts.veggies;
    this.noodles = parts.noodles;
    this.sauce = parts.sauce;
    return this;
  }

  reset(): this {
    this.meats = [];
    this.doneness = undefined;
    this.veggies = [];
    this.noodles = [];
    this.sauce = undefined;
    return this;
  }

  addMeat(id: string): this {
    this.meats.push(this.catalog.findInCategory(id, 'meat'));
    return this;
  }

  removeMeat(id: string): this {
    this.meats = GrillOrderBuilder.removeOne(this.meats, id);
    return this;
  }

  setDoneness(doneness: Doneness): this {
    if (!DONENESS_LEVELS.includes(doneness)) {
      throw new BadRequestException(`ไม่มีระดับความสุก "${doneness}"`);
    }
    this.doneness = doneness;
    return this;
  }

  addVeggie(id: string): this {
    this.veggies.push(this.catalog.findInCategory(id, 'veggie'));
    return this;
  }

  removeVeggie(id: string): this {
    this.veggies = GrillOrderBuilder.removeOne(this.veggies, id);
    return this;
  }

  addNoodle(id: string): this {
    this.noodles.push(this.catalog.findInCategory(id, 'noodle'));
    return this;
  }

  removeNoodle(id: string): this {
    this.noodles = GrillOrderBuilder.removeOne(this.noodles, id);
    return this;
  }

  setSauce(id: string): this {
    this.sauce = this.catalog.findInCategory(id, 'sauce');
    return this;
  }

  // ตรวจกฎของร้าน ถ้าผ่านจึงสร้างออเดอร์ แล้ว reset ตัวเองรอออเดอร์ถัดไป
  // keepIdentityOf: ใช้ตอนแก้ไขออเดอร์ ให้ออเดอร์ใหม่ได้ id / createdAt / origin ของตัวเดิม
  build(keepIdentityOf?: GrillOrder): GrillOrder {
    if (this.meats.length === 0) {
      throw new BadRequestException('ต้องเลือกเนื้ออย่างน้อย 1 อย่าง');
    }
    if (!this.doneness) {
      throw new BadRequestException('กรุณาเลือกระดับความสุก');
    }
    const hasPorkOrChicken = this.meats.some(
      (m) => m.meatKind === 'pork' || m.meatKind === 'chicken',
    );
    if (hasPorkOrChicken && this.doneness !== 'สุกมาก') {
      throw new BadRequestException('หมูและไก่ต้องสุกมากเท่านั้น เพื่อความปลอดภัย');
    }
    if (!this.sauce) {
      throw new BadRequestException('กรุณาเลือกน้ำจิ้ม 1 อย่าง');
    }

    const order = new GrillOrder({
      meats: this.meats,
      doneness: this.doneness,
      veggies: this.veggies,
      noodles: this.noodles,
      sauce: this.sauce,
    }, keepIdentityOf?.getIdentity());
    this.reset();
    return order;
  }

  // ลบออกทีละ 1 ชิ้น (สั่งหมูสามชั้น 2 จาน แล้วลบ 1 จะเหลือ 1)
  private static removeOne(list: MenuItem[], id: string): MenuItem[] {
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return list;
    return [...list.slice(0, index), ...list.slice(index + 1)];
  }
}
