import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface LoginResult {
  token: string;
  username: string;
}

// ระบบเข้าสู่ระบบแบบง่ายสำหรับเดโม: บัญชีเดียว token เก็บใน In-Memory Map (restart backend แล้ว token หาย)
@Injectable()
export class AuthService {
  private readonly sessions = new Map<string, string>(); // token → username
  private readonly username = process.env.AUTH_USERNAME || 'wayu';
  private readonly password = process.env.AUTH_PASSWORD || '1234';

  login(username: string, password: string): LoginResult {
    // ข้อความเดียวกันทุกกรณี ไม่บอกว่าผิดที่ชื่อหรือรหัส
    if (username !== this.username || password !== this.password) {
      throw new UnauthorizedException('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
    const token = randomUUID();
    this.sessions.set(token, username);
    return { token, username };
  }

  logout(token: string): void {
    this.sessions.delete(token);
  }

  verify(token: string): string | null {
    return this.sessions.get(token) ?? null;
  }
}
