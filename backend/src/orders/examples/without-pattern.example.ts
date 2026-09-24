/**
 * ⚠️ ไฟล์ตัวอย่างสำหรับอธิบาย "ปัญหา" ในวิดีโอเท่านั้น ไม่ได้ถูกใช้ในระบบจริง
 * เปรียบเทียบกับ grill-order.builder.ts และ grill-order.ts
 */

// ❌ ปัญหาที่ 1: Telescoping Constructor
// ออเดอร์มีตัวเลือกเยอะ ต้องรับพารามิเตอร์ทุกตัวเรียงกันใน constructor เดียว
class BadGrillOrder {
  constructor(
    public meat1: string | null,
    public meat2: string | null,
    public meat3: string | null,
    public doneness: string | null,
    public veggie1: string | null,
    public veggie2: string | null,
    public noodle: string | null,
    public sauce: string | null,
  ) {}
}

// สั่งหมูสามชั้นกับผักบุ้ง ต้องใส่ null เต็มไปหมด อ่านไม่ออกว่าช่องไหนคืออะไร
const order1 = new BadGrillOrder('หมูสามชั้น', null, null, 'สุกมาก', 'ผักบุ้ง', null, null, 'สุกี้');

// สลับลำดับผิดนิดเดียว (เอาน้ำจิ้มไปใส่ช่องความสุก) TypeScript ก็ไม่เตือน เพราะเป็น string เหมือนกัน
const order2 = new BadGrillOrder('หมูสามชั้น', null, null, 'สุกี้', 'ผักบุ้ง', null, null, 'สุกมาก');

// ไม่มีที่ตรวจกฎของร้าน สร้างหมูสุกน้อยได้ทันที
const order3 = new BadGrillOrder('สันคอหมู', null, null, 'สุกน้อย', null, null, null, null);

// ❌ ปัญหาที่ 2: สั่งซ้ำต้องสร้างใหม่ทั้งหมด ใส่ค่าซ้ำทุกตัว
const repeatOrder1 = new BadGrillOrder(
  order1.meat1, order1.meat2, order1.meat3, order1.doneness,
  order1.veggie1, order1.veggie2, order1.noodle, order1.sauce,
); // ถ้าวันหลังเพิ่ม field ใหม่ ต้องมาแก้ทุกจุดที่เขียนแบบนี้

// ❌ ปัญหาที่ 3: Shallow Copy ทำให้ของเดิมพัง
const standardSet = { name: 'เซ็ตมาตรฐาน', veggies: ['ผักบุ้ง', 'กะหล่ำปลี'] };
const myOrder = { ...standardSet }; // copy แค่ชั้นนอก veggies ยังเป็น array ตัวเดียวกัน
myOrder.veggies.push('ข้าวโพด');
// ตอนนี้ standardSet.veggies กลายเป็น ['ผักบุ้ง', 'กะหล่ำปลี', 'ข้าวโพด'] ไปด้วย! ลูกค้าคนต่อไปได้ข้าวโพดโดยไม่ได้สั่ง

/**
 * ✅ วิธีแก้ในระบบจริง
 * - Builder Pattern: new GrillOrderBuilder(catalog).addMeat('pork-belly').setDoneness('สุกมาก')
 *     .addVeggie('morning-glory').setSauce('suki-sauce').build()
 *   ใส่เฉพาะที่เลือก อ่านง่าย และ build() ตรวจกฎของร้านก่อนสร้างเสมอ
 * - Prototype Pattern: order.clone() คัดลอกตัวเองแบบ deep copy
 *   สั่งซ้ำได้ในบรรทัดเดียว และแก้ตัวใหม่แล้วเซ็ตต้นแบบไม่เปลี่ยนตาม
 */
export { order2, order3, repeatOrder1 };
