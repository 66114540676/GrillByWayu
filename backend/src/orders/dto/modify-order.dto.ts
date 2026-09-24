import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { DONENESS_LEVELS } from '../../menu/menu.types';
import type { Doneness } from '../../menu/menu.types';

// สิ่งที่ลูกค้าอยากปรับจากเซ็ตต้นแบบ หรือจากออเดอร์เดิมตอนแก้ไข ไม่ส่งมาเลยก็ได้ (ใช้ของเดิมทั้งหมด)
// example รวมกันแล้วใช้กับเซ็ต standard ได้เลย (หมูสามชั้น + สันคอหมู สุกมาก ผักบุ้ง กะหล่ำปลี วุ้นเส้น น้ำจิ้มสุกี้)
export class ModifyOrderDto {
  @ApiPropertyOptional({ description: 'id ของเนื้อที่จะเพิ่ม', type: [String], example: ['sesame-chicken'] })
  @IsOptional() @IsArray() @IsString({ each: true }) addMeatIds?: string[];

  @ApiPropertyOptional({ description: 'id ของเนื้อที่จะเอาออก (ทีละ 1 จาน)', type: [String], example: ['pork-neck'] })
  @IsOptional() @IsArray() @IsString({ each: true }) removeMeatIds?: string[];

  @ApiPropertyOptional({ description: 'id ของผักที่จะเพิ่ม', type: [String], example: ['corn'] })
  @IsOptional() @IsArray() @IsString({ each: true }) addVeggieIds?: string[];

  @ApiPropertyOptional({ description: 'id ของผักที่จะเอาออก', type: [String], example: ['cabbage'] })
  @IsOptional() @IsArray() @IsString({ each: true }) removeVeggieIds?: string[];

  @ApiPropertyOptional({ description: 'id ของเส้นที่จะเพิ่ม', type: [String], example: ['instant-noodle'] })
  @IsOptional() @IsArray() @IsString({ each: true }) addNoodleIds?: string[];

  @ApiPropertyOptional({ description: 'id ของเส้นที่จะเอาออก', type: [String], example: ['glass-noodle'] })
  @IsOptional() @IsArray() @IsString({ each: true }) removeNoodleIds?: string[];

  @ApiPropertyOptional({ description: 'เปลี่ยนน้ำจิ้มเป็น id นี้', example: 'jaew-sauce' })
  @IsOptional() @IsString() sauceId?: string;

  @ApiPropertyOptional({ description: 'เปลี่ยนระดับความสุก (หมูและไก่ต้องสุกมาก)', enum: [...DONENESS_LEVELS], example: 'สุกมาก' })
  @IsOptional()
  @IsIn([...DONENESS_LEVELS], { message: 'ระดับความสุกไม่ถูกต้อง' })
  doneness?: Doneness;
}
