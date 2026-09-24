import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ — GrillByWayu',
};

// หัวเว็บ prerender ได้ ส่วนฟอร์มอ่าน ?reason= จาก URL (useSearchParams) จึงห่อด้วย Suspense
export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <header className="bg-stool text-paper">
        <div className="mx-auto max-w-6xl px-5 pb-4 pt-8">
          <h1 className="font-display text-5xl font-semibold leading-none sm:text-6xl">GrillByWayu</h1>
          <p className="mt-2 text-lg text-paper/85">หมูกระทะ จัดชุดเองได้ทุกอย่าง</p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 py-10">
        <Suspense fallback={<p aria-live="polite">กำลังโหลด...</p>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
