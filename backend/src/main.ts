import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger UI ที่ http://localhost:3001/docs
  const config = new DocumentBuilder()
    .setTitle('GrillByWayu API')
    .setDescription('ระบบสั่งหมูกระทะ ใช้ Builder Pattern และ Prototype Pattern')
    .addBearerAuth() // ปุ่ม Authorize ใส่ token จาก POST /auth/login
    .build();
  // autoTagControllers: false ไม่ให้ Swagger เติม tag "Orders" จากชื่อ class ซ้ำกับ tag orders / sets ที่ใส่เอง
  SwaggerModule.setup('docs', app, () =>
    SwaggerModule.createDocument(app, config, { autoTagControllers: false }),
  );

  await app.listen(process.env.PORT ?? 3001); // frontend ใช้ 3000 จึงให้ backend ใช้ 3001
}
void bootstrap();
