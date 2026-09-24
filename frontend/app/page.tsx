'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from './components/ConfirmDialog';
import { OrderItemList } from './components/OrderItemList';
import {
  api, listItems, selectionFromSet, toModifications,
  type Doneness, type Menu, type MenuItem, type Order, type Selection, type SignatureSet,
} from '@/lib/api';

type Tab = 'build' | 'sets' | 'orders';
const EMPTY: Selection = { meatIds: [], veggieIds: [], noodleIds: [] };
const baht = (n: number) => `฿${n.toLocaleString('th-TH')}`;

const TABS: { id: Tab; label: string; pattern: string }[] = [
  { id: 'build', label: 'จัดชุดเอง', pattern: 'Builder' },
  { id: 'sets', label: 'เซ็ตแนะนำ', pattern: 'Prototype' },
  { id: 'orders', label: 'ประวัติออเดอร์', pattern: 'Prototype' },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>('build');
  const [menu, setMenu] = useState<Menu | null>(null);
  const [sets, setSets] = useState<SignatureSet[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadError, setLoadError] = useState('');

  const [selection, setSelection] = useState<Selection>(EMPTY);
  // เปิดได้ทีละอย่าง: ปรับจากเซ็ต หรือแก้ไขออเดอร์เดิม
  const [editingSet, setEditingSet] = useState<SignatureSet | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [latest, setLatest] = useState<Order | null>(null);
  const [highlightId, setHighlightId] = useState('');
  const [pendingDelete, setPendingDelete] = useState<{ type: 'one'; id: string } | { type: 'all' } | null>(null);

  useEffect(() => {
    Promise.all([api.getMenu(), api.getSets(), api.getOrders()])
      .then(([m, s, o]) => { setMenu(m); setSets(s); setOrders(o); })
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  const refreshOrders = useCallback(async () => setOrders(await api.getOrders()), []);

  // หา MenuItem จาก id ไว้แสดงผลและคำนวณราคาตัวอย่าง (ราคาจริงใช้ค่าจาก backend)
  const byId = useMemo(() => {
    const map = new Map<string, MenuItem>();
    if (menu) [...menu.meats, ...menu.veggies, ...menu.noodles, ...menu.sauces].forEach((i) => map.set(i.id, i));
    return map;
  }, [menu]);
  const pick = (ids: string[]) => ids.map((id) => byId.get(id)).filter((i): i is MenuItem => !!i);

  const meats = pick(selection.meatIds);
  const veggies = pick(selection.veggieIds);
  const noodles = pick(selection.noodleIds);
  const sauce = selection.sauceId ? byId.get(selection.sauceId) : undefined;
  const previewPrice = [...meats, ...veggies, ...noodles, ...(sauce ? [sauce] : [])].reduce((s, i) => s + i.price, 0);
  const needsWellDone = meats.some((m) => m.meatKind === 'pork' || m.meatKind === 'chicken');

  const toggle = (key: 'meatIds' | 'veggieIds' | 'noodleIds', id: string) =>
    setSelection((s) => ({ ...s, [key]: s[key].includes(id) ? s[key].filter((x) => x !== id) : [...s[key], id] }));

  const startFromSet = (set: SignatureSet) => {
    setEditingOrder(null);
    setEditingSet(set);
    setSelection(selectionFromSet(set));
    setError('');
    setLatest(null);
    setTab('build');
  };

  const startEditOrder = (order: Order) => {
    setEditingSet(null);
    setEditingOrder(order);
    setSelection(selectionFromSet(order));
    setError('');
    setLatest(null);
    setTab('build');
  };

  const clearBuilder = () => { setSelection(EMPTY); setEditingSet(null); setEditingOrder(null); setError(''); };

  const cancelEdit = () => { clearBuilder(); setTab('orders'); };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      // [Prototype + Builder] backend clone ออเดอร์เดิม แล้วปรับเฉพาะส่วนที่เปลี่ยน ได้ id เดิม
      if (editingOrder) {
        const updated = await api.updateOrder(editingOrder.id, toModifications(editingOrder, selection));
        clearBuilder();
        await refreshOrders();
        setHighlightId(updated.id);
        setTab('orders');
        return;
      }
      const order = editingSet
        ? await api.orderFromSet(editingSet.id, toModifications(editingSet, selection))
        : await api.createOrder(selection);
      setLatest(order);
      setSelection(EMPTY);
      setEditingSet(null);
      await refreshOrders();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const orderSetAsIs = async (set: SignatureSet) => {
    try {
      const order = await api.orderFromSet(set.id);
      await refreshOrders();
      setHighlightId(order.id);
      setTab('orders');
    } catch (e) {
      setLoadError((e as Error).message);
    }
  };

  const repeat = async (id: string) => {
    try {
      const order = await api.repeatOrder(id);
      await refreshOrders();
      setHighlightId(order.id);
    } catch (e) {
      setLoadError((e as Error).message);
    }
  };

  // ลบจริงหลังกดยืนยันในกล่อง ConfirmDialog เท่านั้น
  const confirmDelete = async () => {
    const target = pendingDelete;
    setPendingDelete(null);
    if (!target) return;
    setLoadError('');
    try {
      if (target.type === 'one') await api.deleteOrder(target.id);
      else await api.clearOrders();
      await refreshOrders();
    } catch (e) {
      setLoadError((e as Error).message);
    }
  };

  const dialogText = pendingDelete?.type === 'one'
    ? { title: 'ลบออเดอร์นี้?', message: `ออเดอร์ #${pendingDelete.id.slice(0, 8)} จะหายจากประวัติ`, confirmLabel: 'ลบออเดอร์' }
    : { title: 'ล้างประวัติทั้งหมด?', message: `ออเดอร์ทั้ง ${orders.length} รายการจะหายจากประวัติ เซ็ตแนะนำไม่ได้รับผลกระทบ`, confirmLabel: 'ล้างประวัติ' };

  return (
    <div className="min-h-screen">
      <header className="bg-stool text-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-5 pb-4 pt-8">
          <div>
            <h1 className="font-display text-5xl font-semibold leading-none sm:text-6xl">GrillByWayu</h1>
            <p className="mt-2 text-lg text-paper/85">หมูกระทะ จัดชุดเองได้ทุกอย่าง</p>
          </div>
          <nav aria-label="เมนูหลัก" className="flex gap-1 rounded-full bg-stool-dark p-1">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}
                className={`rounded-full px-4 py-2 text-sm font-medium outline-offset-2 focus-visible:outline-2 focus-visible:outline-paper ${
                  tab === t.id ? 'bg-paper text-ink' : 'text-paper/90 hover:bg-stool'}`}>
                {t.label}
                {t.id === 'orders' && orders.length > 0 && <span className="ml-1.5 opacity-70">{orders.length}</span>}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <p className="mb-6 text-sm text-ink/60">
          หน้านี้ใช้ <strong className="text-ink">{TABS.find((t) => t.id === tab)?.pattern} Pattern</strong>
          {tab === 'build' && editingSet && ' ร่วมกับ Prototype (ปรับจากเซ็ตที่คัดลอกมา)'}
          {tab === 'build' && editingOrder && ' ร่วมกับ Prototype (แก้จากออเดอร์ที่ clone มา)'}
        </p>

        {loadError && (
          <p role="alert" className="mb-6 rounded-lg border-2 border-stool bg-paper px-4 py-3 text-stool">{loadError}</p>
        )}
        {!menu && !loadError && <p aria-live="polite">กำลังโหลดเมนู...</p>}

        {/* ---------- จัดชุดเอง (Builder) ---------- */}
        {menu && tab === 'build' && (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-8">
              {editingSet && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-paper px-4 py-3">
                  <span>กำลังปรับ <strong>{editingSet.name}</strong> ต้นแบบของเซ็ตจะไม่เปลี่ยน</span>
                  <button onClick={clearBuilder} className="text-sm underline">เริ่มจัดใหม่เอง</button>
                </div>
              )}
              {editingOrder && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-paper px-4 py-3">
                  <span>กำลังแก้ไขออเดอร์ <strong>#{editingOrder.id.slice(0, 8)}</strong></span>
                  <button onClick={cancelEdit} className="text-sm underline">ยกเลิกการแก้ไข</button>
                </div>
              )}

              <Step n={1} title="เลือกเนื้อ" hint="เลือกได้หลายอย่าง">
                <ChipGrid items={menu.meats} selected={selection.meatIds} onToggle={(id) => toggle('meatIds', id)} />
              </Step>

              <Step n={2} title="ความสุก">
                <div className="flex flex-wrap gap-2">
                  {menu.doneness.map((d: Doneness) => (
                    <Chip key={d} active={selection.doneness === d} onClick={() => setSelection((s) => ({ ...s, doneness: d }))}>
                      {d}
                    </Chip>
                  ))}
                </div>
                {needsWellDone && selection.doneness !== 'สุกมาก' && (
                  <p className="mt-3 text-sm text-stool">ในชุดมีหมูหรือไก่ ร้านย่างให้เฉพาะแบบสุกมาก</p>
                )}
              </Step>

              <Step n={3} title="ผัก" hint="จานละ ฿20">
                <ChipGrid items={menu.veggies} selected={selection.veggieIds} onToggle={(id) => toggle('veggieIds', id)} />
              </Step>

              <Step n={4} title="เส้น" hint="จานละ ฿15">
                <ChipGrid items={menu.noodles} selected={selection.noodleIds} onToggle={(id) => toggle('noodleIds', id)} />
              </Step>

              <Step n={5} title="น้ำจิ้ม" hint="เลือก 1 อย่าง ฟรี">
                <div className="flex flex-wrap gap-2">
                  {menu.sauces.map((s) => (
                    <Chip key={s.id} active={selection.sauceId === s.id} onClick={() => setSelection((x) => ({ ...x, sauceId: s.id }))}>
                      {s.emoji} {s.name}
                    </Chip>
                  ))}
                </div>
              </Step>
            </div>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-2xl bg-paper p-5">
                <h2 className="mb-4 font-display text-2xl font-medium">ชุดของคุณ</h2>
                <OrderItemList meats={meats} doneness={selection.doneness} veggies={veggies} noodles={noodles} sauce={sauce} />
                <div className="mt-4 flex items-baseline justify-between border-t border-steel-deep pt-4">
                  <span>ราคารวม</span>
                  <span className="font-display text-3xl font-semibold">{baht(previewPrice)}</span>
                </div>
                <button onClick={submit} disabled={submitting}
                  className="mt-4 w-full rounded-xl bg-stool py-3 font-display text-lg font-medium text-paper hover:bg-stool-dark disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                  {submitting
                    ? (editingOrder ? 'กำลังบันทึก...' : 'กำลังส่งออเดอร์...')
                    : editingOrder ? 'บันทึกการแก้ไข' : editingSet ? 'สั่งเซ็ตที่ปรับแล้ว' : 'สั่งชุดนี้'}
                </button>
                {error && <p role="alert" className="mt-3 text-sm text-stool">{error}</p>}
                <div aria-live="polite">
                  {latest && (
                    <p className="mt-3 rounded-lg bg-leaf/10 px-3 py-2 text-sm text-leaf">
                      สั่งแล้ว ออเดอร์ #{latest.id.slice(0, 8)} ราคา {baht(latest.totalPrice)}
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* ---------- เซ็ตแนะนำ (Prototype) ---------- */}
        {menu && tab === 'sets' && (
          <div className="grid gap-5 md:grid-cols-3">
            {sets.map((set) => (
              <article key={set.id} className="flex flex-col rounded-2xl bg-paper p-5">
                <h2 className="font-display text-2xl font-medium">{set.name}</h2>
                <p className="mt-1 text-sm text-ink/70">{set.description}</p>
                <div className="mt-4">
                  <OrderItemList compact meats={set.meats} doneness={set.doneness} veggies={set.veggies}
                    noodles={set.noodles} sauce={set.sauce} />
                </div>
                {/* mt-auto ดันราคาและปุ่มลงล่างสุด การ์ดในแถวเดียวกันจึงมีปุ่มตรงกัน */}
                <p className="mt-auto pt-4 font-display text-2xl font-semibold">{baht(set.totalPrice)}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => orderSetAsIs(set)}
                    className="flex-1 rounded-xl bg-stool py-2.5 font-medium text-paper hover:bg-stool-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                    สั่งเลย
                  </button>
                  <button onClick={() => startFromSet(set)}
                    className="flex-1 rounded-xl border-2 border-ink py-2.5 font-medium hover:bg-steel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                    ปรับเซ็ตนี้
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* ---------- ประวัติ + สั่งซ้ำ (Prototype) ---------- */}
        {menu && tab === 'orders' && (
          orders.length === 0 ? (
            <div className="rounded-2xl bg-paper p-8 text-center">
              <p>ยังไม่มีออเดอร์ ลองจัดชุดเองหรือเลือกเซ็ตแนะนำ</p>
              <button onClick={() => setTab('build')} className="mt-3 underline">ไปจัดชุดเอง</button>
            </div>
          ) : (
            <>
            <div className="mb-3 flex justify-end">
              <button onClick={() => setPendingDelete({ type: 'all' })}
                className="rounded-xl px-3 py-2 text-sm font-medium text-stool hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stool">
                ล้างประวัติทั้งหมด
              </button>
            </div>
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.id} className={`flex flex-wrap items-center gap-4 rounded-2xl bg-paper p-4 ${
                  o.id === highlightId ? 'ring-4 ring-broth' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink/60">
                      <span>#{o.id.slice(0, 8)}</span> <span className="mx-1">เวลา {new Date(o.createdAt).toLocaleTimeString("th-TH")}</span>
                      {o.updatedAt && <span className="mr-1">แก้ไขเมื่อ {new Date(o.updatedAt).toLocaleTimeString("th-TH")}</span>} <OriginText order={o} />
                    </p>
                    <p className="mt-1">{listItems(o)}</p>
                    <p className="text-sm text-ink/70">{o.sauce.name}, {o.doneness}</p>
                  </div>
                  <span className="font-display text-xl font-semibold">{baht(o.totalPrice)}</span>
                  <button onClick={() => repeat(o.id)}
                    className="rounded-xl border-2 border-ink px-4 py-2 font-medium hover:bg-steel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                    สั่งซ้ำ
                  </button>
                  <button onClick={() => startEditOrder(o)} aria-label={`แก้ไขออเดอร์ #${o.id.slice(0, 8)}`}
                    className="rounded-xl border-2 border-ink px-4 py-2 font-medium hover:bg-steel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                    แก้ไข
                  </button>
                  <button onClick={() => setPendingDelete({ type: 'one', id: o.id })} aria-label={`ลบออเดอร์ #${o.id.slice(0, 8)}`}
                    className="rounded-xl px-3 py-2 font-medium text-stool hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stool">
                    ลบ
                  </button>
                </li>
              ))}
            </ul>
            </>
          )
        )}

        <ConfirmDialog open={pendingDelete !== null} {...dialogText}
          onConfirm={confirmDelete} onCancel={() => setPendingDelete(null)} />
      </main>
    </div>
  );
}

function OriginText({ order }: { order: Order }) {
  const o = order.origin;
  if (o.type === 'repeat') return <span className="text-leaf">สั่งซ้ำจาก #{o.fromOrderId.slice(0, 8)}</span>;
  if (o.type === 'set') return <span>จาก{o.setName}</span>;
  return <span>จัดชุดเอง</span>;
}

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="mb-3 flex items-baseline gap-3 font-display text-xl font-medium">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-base text-paper">{n}</span>
        {title}
        {hint && <span className="font-body text-sm font-normal text-ink/60">{hint}</span>}
      </h2>
      {children}
    </section>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      className={`rounded-full border-2 px-4 py-2 outline-offset-2 focus-visible:outline-2 focus-visible:outline-ink ${
        active ? 'border-stool bg-stool text-paper' : 'border-steel-deep bg-paper hover:border-ink'}`}>
      {children}
    </button>
  );
}

function ChipGrid({ items, selected, onToggle }: { items: MenuItem[]; selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item) => {
        const active = selected.includes(item.id);
        return (
          <button key={item.id} onClick={() => onToggle(item.id)} aria-pressed={active}
            className={`flex flex-col items-start rounded-xl border-2 p-3 text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-ink ${
              active ? 'border-stool bg-stool text-paper' : 'border-steel-deep bg-paper hover:border-ink'}`}>
            <span className="text-2xl" aria-hidden>{item.emoji}</span>
            <span className="mt-1 font-medium">{item.name}</span>
            <span className={`text-sm ${active ? 'text-paper/85' : 'text-ink/60'}`}>{baht(item.price)}</span>
          </button>
        );
      })}
    </div>
  );
}
