import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { DONENESS_LEVELS } from '../../menu/menu.types';
import type { Doneness } from '../../menu/menu.types';

// สิ่งที่ลูกค้าอยากปรับจากเซ็ตต้นแบบ หรือจากออเดอร์เดิมตอนแก้ไข ไม่ส่งมาเลยก็ได้ (ใช้ของเดิมทั้งหมด)
export class ModifyOrderDto {
  @IsOptional() @IsArray() @IsString({ each: true }) addMeatIds?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) removeMeatIds?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) addVeggieIds?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) removeVeggieIds?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) addNoodleIds?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) removeNoodleIds?: string[];
  @IsOptional() @IsString() sauceId?: string;

  @IsOptional()
  @IsIn([...DONENESS_LEVELS], { message: 'ระดับความสุกไม่ถูกต้อง' })
  doneness?: Doneness;
}
