import { randomUUID } from 'crypto';
import { Prototype } from '../common/prototype.interface';
import { Doneness, MenuItem } from '../menu/menu.types';

export interface GrillOrderParts {
  meats: MenuItem[];
  doneness: Doneness;
  veggies: MenuItem[];
  noodles: MenuItem[];
  sauce: MenuItem;
}

// ที่มาของออเดอร์ ใช้แสดงผลบนหน้าเว็บว่าสร้างด้วย Pattern ไหน
export type OrderOrigin =
  | { type: 'custom' }
  | { type: 'repeat'; fromOrderId: string }
  | { type: 'set'; setId: string; setName: string };

// ตัวตนของออเดอร์ ใช้ตอนแก้ไข: ออเดอร์ที่ build ใหม่จะได้ id, เวลาสั่ง และที่มาเดิม
export interface OrderIdentity {
  id: string;
  createdAt: Date;
  origin: OrderOrigin;
}

// [Builder: Product] + [Prototype: Concrete Prototype]
// ห้ามสร้างตรงๆ ด้วย new ในโค้ดทั่วไป ให้สร้างผ่าน GrillOrderBuilder เท่านั้น
export class GrillOrder implements Prototype<GrillOrder> {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt?: Date;
  private origin: OrderOrigin = { type: 'custom' };

  // Encapsulation: ข้อมูลเป็น private แก้จากภายนอกไม่ได้
  private readonly meats: MenuItem[];
  private readonly doneness: Doneness;
  private readonly veggies: MenuItem[];
  private readonly noodles: MenuItem[];
  private readonly sauce: MenuItem;

  // ไม่ส่ง identity = ออเดอร์ใหม่ (id และเวลาใหม่) ส่งมา = ออเดอร์เดิมที่ถูกแก้ไข
  constructor(parts: GrillOrderParts, identity?: OrderIdentity) {
    this.meats = parts.meats;
    this.doneness = parts.doneness;
    this.veggies = parts.veggies;
    this.noodles = parts.noodles;
    this.sauce = parts.sauce;

    if (identity) {
      this.id = identity.id;
      this.createdAt = identity.createdAt;
      this.origin = { ...identity.origin };
      this.updatedAt = new Date();
    } else {
      this.id = randomUUID();
      this.createdAt = new Date();
    }
  }

  // [Prototype] คัดลอกตัวเองแบบ Deep Copy
  // - สร้าง array และ object ข้างในใหม่ทั้งหมด แก้ตัวใหม่แล้วตัวเดิมไม่เปลี่ยนตาม
  // - ตัวที่คัดลอกได้ id และ createdAt ใหม่ (เพราะเป็นออเดอร์ใหม่)
  clone(): GrillOrder {
    const copy = new GrillOrder(this.getParts());
    copy.origin = { ...this.origin };
    return copy;
  }

  // คืนสำเนาของส่วนประกอบ (ไม่คืน array ตัวจริงออกไป)
  getParts(): GrillOrderParts {
    return {
      meats: this.meats.map((m) => ({ ...m })),
      doneness: this.doneness,
      veggies: this.veggies.map((v) => ({ ...v })),
      noodles: this.noodles.map((n) => ({ ...n })),
      sauce: { ...this.sauce },
    };
  }

  getIdentity(): OrderIdentity {
    return { id: this.id, createdAt: this.createdAt, origin: { ...this.origin } };
  }

  markOrigin(origin: OrderOrigin): void {
    this.origin = origin;
  }

  getTotalPrice(): number {
    const items = [...this.meats, ...this.veggies, ...this.noodles, this.sauce];
    return items.reduce((sum, item) => sum + item.price, 0);
  }

  // ข้อมูลรายการอาหาร (ไม่รวม id) ใช้แสดงเซ็ตเมนู
  toSummary() {
    return { ...this.getParts(), totalPrice: this.getTotalPrice() };
  }

  // NestJS เรียก toJSON อัตโนมัติตอนส่ง response
  toJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString() ?? null,
      origin: this.origin,
      ...this.toSummary(),
    };
  }
}
