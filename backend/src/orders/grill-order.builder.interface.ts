import type { Doneness } from '../menu/menu.types';
import type { GrillOrder } from './grill-order';

// [Builder: Builder interface]
// กำหนดขั้นตอนการประกอบออเดอร์ Concrete Builder ทุกตัวต้องมีเมธอดเหล่านี้
// เมธอดขั้นตอนคืน this จึงเขียนต่อกันแบบ method chaining ได้
export interface IGrillOrderBuilder {
  addMeat(id: string): this;
  removeMeat(id: string): this;
  setDoneness(doneness: Doneness): this;
  addVeggie(id: string): this;
  removeVeggie(id: string): this;
  addNoodle(id: string): this;
  removeNoodle(id: string): this;
  setSauce(id: string): this;
  reset(): this;
  build(keepIdentityOf?: GrillOrder): GrillOrder;
}
