'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { api, tokenStore } from '@/lib/api';

// ?reason=expired มาจากหน้าหลักตอนเจอ 401 ระหว่างใช้งาน
export const EXPIRED_REASON = 'expired';

export function LoginForm() {
  const router = useRouter();
  const expired = useSearchParams().get('reason') === EXPIRED_REASON;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // login อยู่แล้ว (token ยังใช้ได้) → ไปหน้าแรกทันที
  useEffect(() => {
    if (!tokenStore.get()) return;
    api.me()
      .then(() => router.replace('/'))
      .catch(() => {
        // token ใช้ไม่ได้แล้ว อยู่หน้านี้ให้ login ใหม่
      });
  }, [router]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // ใช้ <form> จึงกด Enter ส่งได้
    setSubmitting(true);
    setError('');
    try {
      await api.login(username, password);
      router.replace('/');
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  const inputClass =
    'mt-1 w-full rounded-xl border-2 border-steel-deep bg-paper px-4 py-2.5 outline-offset-2 focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-ink';

  return (
    <div className="rounded-2xl bg-paper p-6">
      <h2 className="font-display text-3xl font-medium">เข้าสู่ระบบ</h2>
      {expired && !error && (
        <p role="status" className="mt-3 rounded-lg bg-broth/20 px-3 py-2 text-sm">
          หมดเวลาเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่
        </p>
      )}

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="username" className="font-medium">ชื่อผู้ใช้</label>
          <input id="username" name="username" autoComplete="username" required value={username}
            onChange={(e) => setUsername(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="password" className="font-medium">รหัสผ่าน</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required value={password}
            onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </div>
        <button type="submit" disabled={submitting}
          className="w-full rounded-xl bg-stool py-3 font-display text-lg font-medium text-paper hover:bg-stool-dark disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
          {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>

      {error && <p role="alert" className="mt-3 text-sm text-stool">{error}</p>}
    </div>
  );
}
