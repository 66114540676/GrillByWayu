export type MenuCategory = 'meat' | 'veggie' | 'noodle' | 'sauce';
export type MeatKind = 'pork' | 'beef' | 'chicken';

export const DONENESS_LEVELS = ['สุกน้อย', 'สุกกลาง', 'สุกมาก'] as const;
export type Doneness = (typeof DONENESS_LEVELS)[number];

export interface MenuItem {
  readonly id: string;
  readonly name: string;
  readonly category: MenuCategory;
  readonly price: number;
  readonly emoji: string;
  readonly meatKind?: MeatKind; // มีเฉพาะหมวดเนื้อ
}
