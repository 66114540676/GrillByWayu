import type { Doneness, MenuItem } from '@/lib/api';

interface OrderItemListProps {
  meats: MenuItem[];
  doneness?: Doneness;
  veggies: MenuItem[];
  noodles: MenuItem[];
  sauce?: MenuItem;
  // compact: รายการเรียงต่อกันแล้วมีบรรทัดความสุกแยก (การ์ดเซ็ต) ไม่ใส่: แยกหัวข้อตามหมวด (กล่องจัดชุด)
  compact?: boolean;
}

const priceText = (item: MenuItem) => (item.price === 0 ? 'ฟรี' : `฿${item.price.toLocaleString('th-TH')}`);

// รายการของในชุด: emoji + ชื่อ ชิดซ้าย ราคาชิดขวา ใช้ร่วมกันทั้งหน้าจัดชุดเองและการ์ดเซ็ตแนะนำ
export function OrderItemList({ meats, doneness, veggies, noodles, sauce, compact = false }: OrderItemListProps) {
  if (compact) {
    return (
      <div className="text-sm">
        <Items items={[...meats, ...veggies, ...noodles, ...(sauce ? [sauce] : [])]} />
        <div className="mt-2 flex justify-between gap-3 border-t border-steel-deep pt-2">
          <span className="text-ink/60">ความสุก</span>
          <span>{doneness ?? '–'}</span>
        </div>
      </div>
    );
  }

  const isEmpty = !meats.length && !doneness && !veggies.length && !noodles.length && !sauce;
  if (isEmpty) return <p className="py-6 text-center text-ink/60">เลือกเนื้อเพื่อเริ่มจัดชุด</p>;

  return (
    <dl className="space-y-3 text-sm">
      <Group label="เนื้อ"><Items items={meats} /></Group>
      <Group label="ความสุก">{doneness ?? <NotSelected />}</Group>
      <Group label="ผัก"><Items items={veggies} /></Group>
      <Group label="เส้น"><Items items={noodles} /></Group>
      <Group label="น้ำจิ้ม"><Items items={sauce ? [sauce] : []} /></Group>
    </dl>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="mb-1 text-xs font-medium text-ink/60">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Items({ items }: { items: MenuItem[] }) {
  if (!items.length) return <NotSelected />;
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={`${item.id}-${i}`} className="flex justify-between gap-3">
          <span><span aria-hidden>{item.emoji}</span> {item.name}</span>
          <span className="shrink-0">{priceText(item)}</span>
        </li>
      ))}
    </ul>
  );
}

function NotSelected() {
  return <span className="text-ink/50">ยังไม่ได้เลือก</span>;
}
