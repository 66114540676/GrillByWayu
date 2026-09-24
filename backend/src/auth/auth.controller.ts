import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'เข้าสู่ระบบ ได้ token สำหรับแนบใน header Authorization' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.username, dto.password);
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ออกจากระบบ token เดิมจะใช้ไม่ได้อีก' })
  logout(@Req() request: AuthenticatedRequest): void {
    this.auth.logout(request.user!.token);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดูผู้ใช้ที่เข้าสู่ระบบอยู่' })
  me(@Req() request: AuthenticatedRequest) {
    return { username: request.user!.username };
  }
}
