import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  const username = process.env.AUTH_USERNAME || 'wayu';
  const password = process.env.AUTH_PASSWORD || '1234';

  const login = (body: object) => request(app.getHttpServer()).post('/auth/login').send(body);

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /auth/login ถูกต้อง → ได้ token และ GET /auth/me คืนชื่อผู้ใช้', async () => {
    const res = await login({ username, password }).expect(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
    expect(res.body.username).toBe(username);

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${res.body.token}`)
      .expect(200);
    expect(me.body).toEqual({ username });
  });

  it('POST /auth/login ผิด → 401 ข้อความเดียวกัน ไม่บอกว่าผิดที่ชื่อหรือรหัส', async () => {
    const wrongPassword = await login({ username, password: `${password}x` }).expect(401);
    const wrongUsername = await login({ username: `${username}x`, password }).expect(401);
    expect(wrongPassword.body.message).toBe('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    expect(wrongUsername.body.message).toBe(wrongPassword.body.message);
    expect(wrongPassword.body.token).toBeUndefined();
  });

  it('POST /auth/login ไม่ส่งรหัสผ่าน → 400', async () => {
    await login({ username }).expect(400);
  });

  it('เรียก /orders โดยไม่มี token หรือ token ปลอม → 401', async () => {
    const noToken = await request(app.getHttpServer()).get('/orders').expect(401);
    expect(noToken.body.message).toBe('กรุณาเข้าสู่ระบบก่อน');

    await request(app.getHttpServer()).get('/orders').set('Authorization', 'Bearer fake-token').expect(401);
    await request(app.getHttpServer())
      .post('/orders')
      .send({ meatIds: ['beef-slice'], doneness: 'สุกกลาง', sauceId: 'jaew-sauce' })
      .expect(401);
  });

  it('GET /menu และ GET /sets ดูได้โดยไม่ต้อง login', async () => {
    await request(app.getHttpServer()).get('/menu').expect(200);
    const sets = await request(app.getHttpServer()).get('/sets').expect(200);
    expect(sets.body).toHaveLength(3);
  });

  it('POST /auth/logout แล้ว token เดิมใช้ไม่ได้', async () => {
    const { body } = await login({ username, password }).expect(200);
    const auth = `Bearer ${body.token}`;
    await request(app.getHttpServer()).get('/orders').set('Authorization', auth).expect(200);

    await request(app.getHttpServer()).post('/auth/logout').set('Authorization', auth).expect(204);

    await request(app.getHttpServer()).get('/orders').set('Authorization', auth).expect(401);
    await request(app.getHttpServer()).get('/auth/me').set('Authorization', auth).expect(401);
  });
});
