import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Orders API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /menu คืนเมนูครบทุกหมวด', async () => {
    const res = await request(app.getHttpServer()).get('/menu').expect(200);
    expect(res.body.meats).toHaveLength(4);
    expect(res.body.sauces).toHaveLength(3);
  });

  it('POST /orders สร้างออเดอร์ และราคามาจาก backend', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders')
      .send({ meatIds: ['beef-slice'], doneness: 'สุกกลาง', veggieIds: ['corn'], sauceId: 'jaew-sauce', price: 1 })
      .expect(201);
    expect(res.body.totalPrice).toBe(149);
    expect(res.body.origin.type).toBe('custom');
  });

  it('POST /orders หมูสุกน้อย → 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders')
      .send({ meatIds: ['pork-belly'], doneness: 'สุกน้อย', sauceId: 'suki-sauce' })
      .expect(400);
    expect(res.body.message).toContain('หมูและไก่ต้องสุกมาก');
  });

  it('POST /orders/:id/clone สั่งซ้ำได้ id ใหม่', async () => {
    const first = await request(app.getHttpServer())
      .post('/orders')
      .send({ meatIds: ['beef-slice'], doneness: 'สุกกลาง', sauceId: 'jaew-sauce' });
    const res = await request(app.getHttpServer()).post(`/orders/${first.body.id}/clone`).expect(201);
    expect(res.body.id).not.toBe(first.body.id);
    expect(res.body.origin).toEqual({ type: 'repeat', fromOrderId: first.body.id });
  });

  it('POST /orders/xxx/clone ไม่มีออเดอร์ → 404', async () => {
    await request(app.getHttpServer()).post('/orders/xxx/clone').expect(404);
  });

  it('POST /sets/:id/order ปรับน้ำจิ้ม แล้วเซ็ตต้นแบบไม่เปลี่ยน', async () => {
    const res = await request(app.getHttpServer())
      .post('/sets/standard/order')
      .send({ sauceId: 'jaew-sauce' })
      .expect(201);
    expect(res.body.sauce.id).toBe('jaew-sauce');

    const sets = await request(app.getHttpServer()).get('/sets').expect(200);
    const standard = sets.body.find((s: { id: string }) => s.id === 'standard');
    expect(standard.sauce.id).toBe('suki-sauce');
  });

  it('GET /orders ใหม่สุดขึ้นก่อน', async () => {
    await request(app.getHttpServer()).post('/sets/standard/order').send({});
    await request(app.getHttpServer()).post('/sets/combo/order').send({});
    const res = await request(app.getHttpServer()).get('/orders').expect(200);
    expect(res.body[0].origin.setId).toBe('combo');
  });

  it('PATCH /orders/:id แก้น้ำจิ้ม ได้ id เดิม น้ำจิ้มใหม่ ราคาถูกต้อง', async () => {
    const created = await request(app.getHttpServer())
      .post('/orders')
      .send({ meatIds: ['beef-slice'], doneness: 'สุกกลาง', veggieIds: ['corn'], sauceId: 'jaew-sauce' });
    await request(app.getHttpServer())
      .patch(`/orders/${created.body.id}`)
      .send({ sauceId: 'suki-sauce' })
      .expect(200);

    const res = await request(app.getHttpServer()).get('/orders').expect(200);
    expect(res.body).toHaveLength(1);
    const order = res.body[0];
    expect(order.id).toBe(created.body.id);
    expect(order.createdAt).toBe(created.body.createdAt);
    expect(order.updatedAt).not.toBeNull();
    expect(order.sauce.id).toBe('suki-sauce');
    expect(order.totalPrice).toBe(149); // 129 + 20 น้ำจิ้มฟรี
  });

  it('PATCH เพิ่มหมูในออเดอร์เนื้อวัวสุกกลาง → 400 และออเดอร์เดิมไม่เปลี่ยน', async () => {
    const created = await request(app.getHttpServer())
      .post('/orders')
      .send({ meatIds: ['beef-slice'], doneness: 'สุกกลาง', sauceId: 'jaew-sauce' });
    const res = await request(app.getHttpServer())
      .patch(`/orders/${created.body.id}`)
      .send({ addMeatIds: ['pork-belly'] })
      .expect(400);
    expect(res.body.message).toContain('หมูและไก่ต้องสุกมาก');

    const orders = await request(app.getHttpServer()).get('/orders').expect(200);
    expect(orders.body).toEqual([created.body]);
  });

  it('PATCH /orders/xxx ไม่มีออเดอร์ → 404', async () => {
    await request(app.getHttpServer()).patch('/orders/xxx').send({ sauceId: 'suki-sauce' }).expect(404);
  });

  it('แก้ออเดอร์ต้นฉบับ ออเดอร์ที่สั่งซ้ำจากมันไม่เปลี่ยนตาม', async () => {
    const original = await request(app.getHttpServer())
      .post('/orders')
      .send({ meatIds: ['beef-slice'], doneness: 'สุกกลาง', sauceId: 'jaew-sauce' });
    const copy = await request(app.getHttpServer()).post(`/orders/${original.body.id}/clone`).expect(201);
    await request(app.getHttpServer())
      .patch(`/orders/${original.body.id}`)
      .send({ sauceId: 'seafood-sauce', addVeggieIds: ['corn'] })
      .expect(200);

    const res = await request(app.getHttpServer()).get('/orders').expect(200);
    const repeated = res.body.find((o: { id: string }) => o.id === copy.body.id);
    expect(repeated).toEqual(copy.body);
    expect(repeated.sauce.id).toBe('jaew-sauce');
    expect(repeated.veggies).toEqual([]);
  });

  it('DELETE /orders/:id ลบแล้ว GET /orders ไม่มีออเดอร์นั้น', async () => {
    const keep = await request(app.getHttpServer()).post('/sets/standard/order').send({});
    const gone = await request(app.getHttpServer()).post('/sets/combo/order').send({});
    await request(app.getHttpServer()).delete(`/orders/${gone.body.id}`).expect(204);

    const res = await request(app.getHttpServer()).get('/orders').expect(200);
    const ids = res.body.map((o: { id: string }) => o.id);
    expect(ids).not.toContain(gone.body.id);
    expect(ids).toContain(keep.body.id);
  });

  it('DELETE /orders/xxx ไม่มีออเดอร์ → 404', async () => {
    const res = await request(app.getHttpServer()).delete('/orders/xxx').expect(404);
    expect(res.body.message).toContain('ไม่พบออเดอร์');
  });

  it('DELETE /orders ล้างทั้งหมด แต่เซ็ตต้นแบบยังอยู่ครบ', async () => {
    await request(app.getHttpServer()).post('/sets/standard/order').send({});
    await request(app.getHttpServer()).post('/sets/combo/order').send({});
    const res = await request(app.getHttpServer()).delete('/orders').expect(200);
    expect(res.body).toEqual({ deleted: 2 });

    const orders = await request(app.getHttpServer()).get('/orders').expect(200);
    expect(orders.body).toEqual([]);
    const sets = await request(app.getHttpServer()).get('/sets').expect(200);
    expect(sets.body).toHaveLength(3);
  });

  it('ลบออเดอร์ต้นฉบับ ออเดอร์ที่สั่งซ้ำยังอยู่ (clone เป็นคนละ object)', async () => {
    const original = await request(app.getHttpServer())
      .post('/orders')
      .send({ meatIds: ['beef-slice'], doneness: 'สุกกลาง', sauceId: 'jaew-sauce' });
    const copy = await request(app.getHttpServer()).post(`/orders/${original.body.id}/clone`).expect(201);
    await request(app.getHttpServer()).delete(`/orders/${original.body.id}`).expect(204);

    const res = await request(app.getHttpServer()).get('/orders').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(copy.body.id);
    expect(res.body[0].meats[0].id).toBe('beef-slice');
  });
});
