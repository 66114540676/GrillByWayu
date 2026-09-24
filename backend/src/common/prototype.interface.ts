// [Prototype] interface กลาง: ออบเจกต์ใดที่ implements ตัวนี้ ต้อง "คัดลอกตัวเองได้"
export interface Prototype<T> {
  clone(): T;
}
