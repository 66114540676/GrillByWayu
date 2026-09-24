import { MenuCatalog } from '../menu/menu.catalog';
import { GrillOrderBuilder } from './grill-order.builder';
import { SignatureSetRegistry } from './signature-set.registry';

describe('GrillOrder.clone() และ SignatureSetRegistry (Prototype Pattern)', () => {
  const catalog = new MenuCatalog();

  const makeOrder = () =>
    new GrillOrderBuilder(catalog)
      .addMeat('pork-belly').setDoneness('สุกมาก')
      .addVeggie('morning-glory').setSauce('suki-sauce')
      .build();

  it('clone ได้ id ใหม่ แต่รายการเหมือนเดิม', () => {
    const original = makeOrder();
    const copy = original.clone();
    expect(copy.id).not.toBe(original.id);
    expect(copy.toSummary()).toEqual(original.toSummary());
  });

  it('deep copy: ปรับตัวที่ clone มา ต้นฉบับไม่เปลี่ยน', () => {
    const original = makeOrder();
    const modified = GrillOrderBuilder.from(original.clone(), catalog)
      .addVeggie('corn').setSauce('jaew-sauce').build();

    expect(modified.toSummary().veggies).toHaveLength(2);
    expect(original.toSummary().veggies).toHaveLength(1);
    expect(original.toSummary().sauce.id).toBe('suki-sauce');
  });

  it('แก้ข้อมูลที่ getParts() คืนมา ไม่กระทบออเดอร์จริง', () => {
    const order = makeOrder();
    order.getParts().veggies.push(catalog.findById('corn'));
    expect(order.toSummary().veggies).toHaveLength(1);
  });

  it('build(keepIdentityOf) ได้ id และ createdAt เดิม และมี updatedAt', () => {
    const original = makeOrder();
    expect(original.updatedAt).toBeUndefined();

    const edited = GrillOrderBuilder.from(original.clone(), catalog)
      .setSauce('jaew-sauce')
      .build(original);

    expect(edited).not.toBe(original);
    expect(edited.id).toBe(original.id);
    expect(edited.createdAt).toEqual(original.createdAt);
    expect(edited.updatedAt).toBeInstanceOf(Date);
    expect(edited.toJSON().updatedAt).toBe(edited.updatedAt?.toISOString());
    expect(edited.toSummary().sauce.id).toBe('jaew-sauce');
    expect(original.toSummary().sauce.id).toBe('suki-sauce');
    expect(original.toJSON().updatedAt).toBeNull();
  });

  it('Registry คืนคนละ object ทุกครั้ง', () => {
    const registry = new SignatureSetRegistry(catalog);
    const a = registry.get('standard').order;
    const b = registry.get('standard').order;
    expect(a).not.toBe(b);
    expect(a.id).not.toBe(b.id);
  });
});
