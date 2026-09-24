import { Injectable, NotFoundException } from '@nestjs/common';
import { MenuCatalog } from '../menu/menu.catalog';
import { GrillOrder } from './grill-order';
import { GrillOrderBuilder } from './grill-order.builder';

export interface SignatureSetInfo {
  id: string;
  name: string;
  description: string;
}

interface SignatureSet extends SignatureSetInfo {
  prototype: GrillOrder; // ตัวต้นแบบ ห้ามส่งออกไปให้ใครแก้
}

// [Prototype: Prototype Registry]
// เก็บเซ็ตเมนูต้นแบบไว้ เวลามีคนสั่ง จะ clone ต้นแบบออกไปเสมอ ไม่ต้องประกอบใหม่ทุกครั้ง
@Injectable()
export class SignatureSetRegistry {
  private readonly sets = new Map<string, SignatureSet>();

  constructor(private readonly catalog: MenuCatalog) {
    // ต้นแบบถูกสร้างด้วย Builder แค่ครั้งเดียวตอนเปิดระบบ
    this.register(
      { id: 'standard', name: 'เซ็ตหมูกระทะมาตรฐาน', description: 'หมูสองอย่าง ผักพื้นฐาน วุ้นเส้น กินกับน้ำจิ้มสุกี้' },
      (b) =>
        b.addMeat('pork-belly').addMeat('pork-neck').setDoneness('สุกมาก')
          .addVeggie('morning-glory').addVeggie('cabbage').addNoodle('glass-noodle').setSauce('suki-sauce'),
    );
    this.register(
      { id: 'premium-beef', name: 'เซ็ตเนื้อพรีเมียม', description: 'เนื้อวัวสไลซ์ย่างสุกกลาง เห็ด ข้าวโพด กินกับน้ำจิ้มแจ่ว' },
      (b) =>
        b.addMeat('beef-slice').setDoneness('สุกกลาง')
          .addVeggie('enoki').addVeggie('corn').setSauce('jaew-sauce'),
    );
    this.register(
      { id: 'combo', name: 'เซ็ตรวมมิตร', description: 'ครบทั้งหมู วัว ไก่ ผักบุ้ง มาม่า กินกับน้ำจิ้มซีฟู้ด' },
      (b) =>
        b.addMeat('pork-belly').addMeat('beef-slice').addMeat('sesame-chicken').setDoneness('สุกมาก')
          .addVeggie('morning-glory').addNoodle('instant-noodle').setSauce('seafood-sauce'),
    );
  }

  list() {
    return [...this.sets.values()].map(({ prototype, ...info }) => ({
      ...info,
      ...prototype.toSummary(),
    }));
  }

  // คืน "สำเนา" ของต้นแบบเสมอ
  get(setId: string): { info: SignatureSetInfo; order: GrillOrder } {
    const set = this.sets.get(setId);
    if (!set) throw new NotFoundException(`ไม่พบเซ็ตรหัส "${setId}"`);
    const { prototype, ...info } = set;
    return { info, order: prototype.clone() };
  }

  private register(
    info: SignatureSetInfo,
    recipe: (builder: GrillOrderBuilder) => GrillOrderBuilder,
  ): void {
    const prototype = recipe(new GrillOrderBuilder(this.catalog)).build();
    this.sets.set(info.id, { ...info, prototype });
  }
}
