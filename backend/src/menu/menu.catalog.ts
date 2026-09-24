import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MenuCategory, MenuItem } from './menu.types';

// เก็บเมนูและราคาทั้งหมดไว้ฝั่ง backend ที่เดียว ลูกค้าส่งมาแค่ id จึงแก้ราคาเองไม่ได้
@Injectable()
export class MenuCatalog {
  private readonly items: ReadonlyArray<MenuItem> = [
    // เนื้อ
    { id: 'pork-belly', name: 'หมูสามชั้น', category: 'meat', meatKind: 'pork', price: 89, emoji: '🥓' },
    { id: 'pork-neck', name: 'สันคอหมู', category: 'meat', meatKind: 'pork', price: 89, emoji: '🐷' },
    { id: 'beef-slice', name: 'เนื้อวัวสไลซ์', category: 'meat', meatKind: 'beef', price: 129, emoji: '🥩' },
    { id: 'sesame-chicken', name: 'ไก่หมักงา', category: 'meat', meatKind: 'chicken', price: 69, emoji: '🍗' },
    // ผัก
    { id: 'morning-glory', name: 'ผักบุ้ง', category: 'veggie', price: 20, emoji: '🥬' },
    { id: 'cabbage', name: 'กะหล่ำปลี', category: 'veggie', price: 20, emoji: '🥗' },
    { id: 'corn', name: 'ข้าวโพด', category: 'veggie', price: 20, emoji: '🌽' },
    { id: 'enoki', name: 'เห็ดเข็มทอง', category: 'veggie', price: 20, emoji: '🍄' },
    // เส้น
    { id: 'glass-noodle', name: 'วุ้นเส้น', category: 'noodle', price: 15, emoji: '🍜' },
    { id: 'instant-noodle', name: 'มาม่า', category: 'noodle', price: 15, emoji: '🍝' },
    // น้ำจิ้ม (ฟรี)
    { id: 'suki-sauce', name: 'น้ำจิ้มสุกี้', category: 'sauce', price: 0, emoji: '🥣' },
    { id: 'seafood-sauce', name: 'น้ำจิ้มซีฟู้ด', category: 'sauce', price: 0, emoji: '🌶️' },
    { id: 'jaew-sauce', name: 'น้ำจิ้มแจ่ว', category: 'sauce', price: 0, emoji: '🫙' },
  ];

  getAll(): MenuItem[] {
    return [...this.items];
  }

  getByCategory(category: MenuCategory): MenuItem[] {
    return this.items.filter((item) => item.category === category);
  }

  findById(id: string): MenuItem {
    const item = this.items.find((i) => i.id === id);
    if (!item) throw new NotFoundException(`ไม่พบเมนูรหัส "${id}"`);
    return item;
  }

  // หาเมนูพร้อมเช็กว่าอยู่ถูกหมวด เช่น ห้ามเอาผักไปใส่ช่องเนื้อ
  findInCategory(id: string, category: MenuCategory): MenuItem {
    const item = this.findById(id);
    if (item.category !== category) {
      throw new BadRequestException(`"${item.name}" ไม่ได้อยู่ในหมวดที่เลือก`);
    }
    return item;
  }
}
