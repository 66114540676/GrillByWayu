'use client';

import { useEffect, useId, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// กล่องยืนยันในหน้าเว็บ ใช้ <dialog> + showModal() จึงกด Esc ปิดได้ และโฟกัสวนอยู่ในกล่อง
export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus(); // เริ่มที่ "ยกเลิก" กันกดลบโดยไม่ตั้งใจ
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog ref={dialogRef} aria-labelledby={titleId} aria-describedby={messageId}
      // กด Esc: ให้ parent ปิดผ่าน state แทนให้ browser ปิดเอง
      onCancel={(e) => { e.preventDefault(); onCancel(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-paper p-6 text-ink backdrop:bg-black/50">
      <h2 id={titleId} className="font-display text-2xl font-medium">{title}</h2>
      <p id={messageId} className="mt-2 text-ink/80">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button ref={cancelRef} onClick={onCancel}
          className="rounded-xl border-2 border-ink px-4 py-2 font-medium hover:bg-steel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
          ยกเลิก
        </button>
        <button onClick={onConfirm}
          className="rounded-xl bg-stool px-4 py-2 font-medium text-paper hover:bg-stool-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
