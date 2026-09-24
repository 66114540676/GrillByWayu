// รวมการเรียก API และ type ของข้อมูลจาก backend ไว้ที่เดียว
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type Doneness = 'สุกน้อย' | 'สุกกลาง' | 'สุกมาก';

export interface MenuItem {
  id: string;
  name: string;
  category: 'meat' | 'veggie' | 'noodle' | 'sauce';
  price: number;
  emoji: string;
  meatKind?: 'pork' | 'beef' | 'chicken';
}

export interface Menu {
  meats: MenuItem[];
  veggies: MenuItem[];
  noodles: MenuItem[];
  sauces: MenuItem[];
  doneness: Doneness[];
}

export interface OrderSummary {
  meats: MenuItem[];
  doneness: Doneness;
  veggies: MenuItem[];
  noodles: MenuItem[];
  sauce: MenuItem;
  totalPrice: number;
}

export type OrderOrigin =
  | { type: 'custom' }
  | { type: 'repeat'; fromOrderId: string }
  | { type: 'set'; setId: string; setName: string };

export interface Order extends OrderSummary {
  id: string;
  createdAt: string;
  updatedAt?: string | null; // มีค่าเมื่อออเดอร์ถูกแก้ไข
  origin: OrderOrigin;
}

export interface SignatureSet extends OrderSummary {
  id: string;
  name: string;
  description: string;
}

// สิ่งที่ลูกค้าเลือกบนหน้าจัดชุด
export interface Selection {
  meatIds: string[];
  doneness?: Doneness;
  veggieIds: string[];
  noodleIds: string[];
  sauceId?: string;
}

export interface OrderModifications {
  addMeatIds?: string[];
  removeMeatIds?: string[];
  addVeggieIds?: string[];
  removeVeggieIds?: string[];
  addNoodleIds?: string[];
  removeNoodleIds?: string[];
  sauceId?: string;
  doneness?: Doneness;
}

// ---------- token เข้าสู่ระบบ ----------
// เก็บใน sessionStorage: ปิดแท็บแล้วต้อง login ใหม่ ห่อ try/catch เพราะบาง browser (เช่น private mode) อาจใช้ไม่ได้
const TOKEN_KEY = 'grillbywayu.token';

export const tokenStore = {
  get(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      // เก็บไม่ได้ก็ใช้ได้แค่รอบนี้ ครั้งหน้าต้อง login ใหม่
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // ไม่มีอะไรให้ลบ
    }
  },
};

// backend ตอบ 401: token ไม่มี / หมดอายุ / ถูก logout ไปแล้ว หน้าเว็บจับ error นี้แล้วพาไปหน้า /login
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(`เชื่อมต่อร้านไม่ได้ ตรวจว่า backend รันอยู่ที่ ${API_URL}`);
  }
  if (res.status === 204) return undefined as T; // สำเร็จแต่ไม่มี body เช่น DELETE /orders/:id
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    // NestJS ส่ง message มาเป็น string หรือ array
    const raw = body?.message;
    const message = Array.isArray(raw) ? raw.join(', ') : raw ?? 'เกิดข้อผิดพลาด';
    if (res.status === 401) {
      tokenStore.clear();
      throw new UnauthorizedError(message);
    }
    throw new Error(message);
  }
  return body as T;
}

export const api = {
  // เข้าสู่ระบบสำเร็จแล้วเก็บ token ไว้ให้ request ถัดไปแนบอัตโนมัติ
  login: async (username: string, password: string) => {
    const result = await request<{ token: string; username: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    tokenStore.set(result.token);
    return result;
  },
  // ลบ token ฝั่งหน้าเว็บเสมอ แม้ backend จะตอบ error (เช่น token หมดอายุไปแล้ว)
  logout: async () => {
    try {
      await request<void>('/auth/logout', { method: 'POST' });
    } finally {
      tokenStore.clear();
    }
  },
  me: () => request<{ username: string }>('/auth/me'),

  getMenu: () => request<Menu>('/menu'),
  getSets: () => request<SignatureSet[]>('/sets'),
  getOrders: () => request<Order[]>('/orders'),
  createOrder: (s: Selection) => request<Order>('/orders', { method: 'POST', body: JSON.stringify(s) }),
  repeatOrder: (id: string) => request<Order>(`/orders/${id}/clone`, { method: 'POST' }),
  deleteOrder: (id: string) => request<void>(`/orders/${id}`, { method: 'DELETE' }),
  clearOrders: () => request<{ deleted: number }>('/orders', { method: 'DELETE' }),
  updateOrder: (id: string, mods: OrderModifications) =>
    request<Order>(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(mods) }),
  orderFromSet: (setId: string, mods: OrderModifications = {}) =>
    request<Order>(`/sets/${setId}/order`, { method: 'POST', body: JSON.stringify(mods) }),
};

// เทียบรายการที่เลือกกับของเดิม (เซ็ตหรือออเดอร์) เพื่อส่งเฉพาะสิ่งที่เปลี่ยน (add/remove)
function diff(base: string[], next: string[]) {
  return {
    add: next.filter((id) => !base.includes(id)),
    remove: base.filter((id) => !next.includes(id)),
  };
}

export function toModifications(base: OrderSummary, s: Selection): OrderModifications {
  const meats = diff(base.meats.map((m) => m.id), s.meatIds);
  const veggies = diff(base.veggies.map((v) => v.id), s.veggieIds);
  const noodles = diff(base.noodles.map((n) => n.id), s.noodleIds);
  return {
    addMeatIds: meats.add,
    removeMeatIds: meats.remove,
    addVeggieIds: veggies.add,
    removeVeggieIds: veggies.remove,
    addNoodleIds: noodles.add,
    removeNoodleIds: noodles.remove,
    sauceId: s.sauceId !== base.sauce.id ? s.sauceId : undefined,
    doneness: s.doneness !== base.doneness ? s.doneness : undefined,
  };
}

// ใช้ได้ทั้งเซ็ตและออเดอร์ เพราะทั้งคู่เป็น OrderSummary
export function selectionFromSet(base: OrderSummary): Selection {
  return {
    meatIds: base.meats.map((m) => m.id),
    doneness: base.doneness,
    veggieIds: base.veggies.map((v) => v.id),
    noodleIds: base.noodles.map((n) => n.id),
    sauceId: base.sauce.id,
  };
}

export function listItems(o: OrderSummary): string {
  return [...o.meats, ...o.veggies, ...o.noodles].map((i) => i.name).join(', ');
}
