import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { DONENESS_LEVELS } from '../../menu/menu.types';
import type { Doneness } from '../../menu/menu.types';

// DTO ตรวจแค่ "รูปแบบข้อมูล" ส่วนกฎของร้าน (ต้องมีเนื้อ หมูต้องสุก ฯลฯ) ให้ Builder ตรวจใน build()
export class CreateOrderDto {
  @ApiProperty({ description: 'id ของเนื้อ อย่างน้อย 1 อย่าง', type: [String], example: ['beef-slice'] })
  @IsArray()
  @IsString({ each: true })
  meatIds: string[] = [];

  @ApiPropertyOptional({ description: 'ระดับความสุก (หมูและไก่ต้องสุกมาก)', enum: [...DONENESS_LEVELS], example: 'สุกกลาง' })
  @IsOptional()
  @IsIn([...DONENESS_LEVELS], { message: 'ระดับความสุกไม่ถูกต้อง' })
  doneness?: Doneness;

  @ApiPropertyOptional({ description: 'id ของผัก', type: [String], example: ['corn'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  veggieIds?: string[];

  @ApiPropertyOptional({ description: 'id ของเส้น', type: [String], example: ['glass-noodle'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  noodleIds?: string[];

  @ApiPropertyOptional({ description: 'id ของน้ำจิ้ม 1 อย่าง', example: 'jaew-sauce' })
  @IsOptional()
  @IsString()
  sauceId?: string;
}
