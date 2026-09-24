import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { DONENESS_LEVELS } from '../../menu/menu.types';
import type { Doneness } from '../../menu/menu.types';

// DTO ตรวจแค่ "รูปแบบข้อมูล" ส่วนกฎของร้าน (ต้องมีเนื้อ หมูต้องสุก ฯลฯ) ให้ Builder ตรวจใน build()
export class CreateOrderDto {
  @IsArray()
  @IsString({ each: true })
  meatIds: string[] = [];

  @IsOptional()
  @IsIn([...DONENESS_LEVELS], { message: 'ระดับความสุกไม่ถูกต้อง' })
  doneness?: Doneness;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  veggieIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  noodleIds?: string[];

  @IsOptional()
  @IsString()
  sauceId?: string;
}
