"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, writeBatch } from "firebase/firestore";

export default function SeedPage() {
  const [status, setStatus] = useState("");
  const [done, setDone] = useState(false);

  const handleSeed = async () => {
    setStatus("กำลัง seed...");
    try {
      // seed ทีละ 500 (Firestore batch limit)
      const batch1 = writeBatch(db);
      for (let i = 0; i < 50; i++) {
        const num = i.toString().padStart(2, "0");
        batch1.set(doc(db, "lottery_numbers", num), {
          number: num,
          status: "available",
          price: 100,
          lockedBy: null,
          lockedAt: null,
          lockExpiresAt: null,
        });
      }
      await batch1.commit();

      const batch2 = writeBatch(db);
      for (let i = 50; i < 100; i++) {
        const num = i.toString().padStart(2, "0");
        batch2.set(doc(db, "lottery_numbers", num), {
          number: num,
          status: "available",
          price: 100,
          lockedBy: null,
          lockedAt: null,
          lockExpiresAt: null,
        });
      }
      await batch2.commit();

      setStatus("✅ Seed สำเร็จ! เลข 00-99 พร้อมใช้งานแล้ว");
      setDone(true);
    } catch (e) {
      setStatus("❌ Error: " + (e instanceof Error ? e.message : "unknown"));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-bold">Seed Firestore</h1>
      {!done && (
        <button
          onClick={handleSeed}
          className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold"
        >
          สร้างเลข 00-99
        </button>
      )}
      {status && <p className="text-sm">{status}</p>}
      {done && (
        <a href="/" className="text-blue-500 underline">
          กลับหน้าหลัก →
        </a>
      )}
    </div>
  );
}