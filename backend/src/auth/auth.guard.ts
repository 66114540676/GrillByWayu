import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';

// request ที่ผ่าน AuthGuard แล้ว จะมีข้อมูลผู้ใช้ติดมาด้วย
export interface AuthenticatedRequest extends Request {
  user?: { username: string; token: string };
}

// อ่าน header "Authorization: Bearer <token>" ถ้าไม่มีหรือไม่ถูกต้อง → 401
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = AuthGuard.extractToken(request.headers.authorization);
    const username = token ? this.auth.verify(token) : null;
    if (!token || !username) throw new UnauthorizedException('กรุณาเข้าสู่ระบบก่อน');

    request.user = { username, token };
    return true;
  }

  private static extractToken(header?: string): string | undefined {
    const [type, token] = header?.split(' ') ?? [];
    return type === 'Bearer' && token ? token : undefined;
  }
}
