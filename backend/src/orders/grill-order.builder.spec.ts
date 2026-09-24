import { BadRequestException } from '@nestjs/common';
import { MenuCatalog } from '../menu/menu.catalog';
import { GrillOrderBuilder } from './grill-order.builder';

describe('GrillOrderBuilder (Builder Pattern)', () => {
  const catalog = new MenuCatalog();
  let builder: GrillOrderBuilder;

  beforeEach(() => {
    builder = new GrillOrderBuilder(catalog);
  });

  it('ประกอบออเดอร์ด้วย method chaining และคิดราคาถูก', () => {
    const order = builder
      .addMeat('pork-belly') // 89
      .addMeat('beef-slice') // 129
      .setDoneness('สุกมาก')
      .addVeggie('corn') // 20
      .addNoodle('glass-noodle') // 15
      .setSauce('suki-sauce') // 0
      .build();
    expect(order.getTotalPrice()).toBe(253);
  });

  it('ไม่มีเนื้อ → สร้างไม่ได้', () => {
    expect(() => builder.setDoneness('สุกมาก').setSauce('suki-sauce').build()).toThrow(
      BadRequestException,
    );
  });

  it('หมูหรือไก่ที่ไม่ใช่สุกมาก → สร้างไม่ได้', () => {
    expect(() =>
      builder.addMeat('pork-neck').setDoneness('สุกน้อย').setSauce('suki-sauce').build(),
    ).toThrow('หมูและไก่ต้องสุกมากเท่านั้น');
  });

  it('เนื้อวัวสุกน้อยได้', () => {
    const order = builder.addMeat('beef-slice').setDoneness('สุกน้อย').setSauce('jaew-sauce').build();
    expect(order.toSummary().doneness).toBe('สุกน้อย');
  });

  it('ไม่เลือกน้ำจิ้ม → สร้างไม่ได้', () => {
    expect(() => builder.addMeat('beef-slice').setDoneness('สุกกลาง').build()).toThrow(
      'กรุณาเลือกน้ำจิ้ม',
    );
  });

  it('ใส่ผักในช่องเนื้อ → ไม่ได้', () => {
    expect(() => builder.addMeat('corn')).toThrow(BadRequestException);
  });

  it('build() แล้ว reset ตัวเอง ออเดอร์ถัดไปไม่ติดของเก่า', () => {
    builder.addMeat('beef-slice').setDoneness('สุกกลาง').setSauce('jaew-sauce').build();
    expect(() => builder.build()).toThrow('ต้องเลือกเนื้อ');
  });
});
