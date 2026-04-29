"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { lockNumber, unlockNumber } from "@/lib/lockNumber";
import { useLiff } from "./LiffProvider";
import type { LotteryNumber, NumberStatus } from "@/types";

const statusStyle: Record<NumberStatus, string> = {
  available: "bg-white border-gray-200 text-gray-700 active:scale-95 cursor-pointer hover:border-green-400 hover:text-green-600",
  locked:    "bg-amber-50 border-amber-300 text-amber-600 cursor-not-allowed",
  reserved:  "bg-red-50 border-red-300 text-red-500 cursor-not-allowed",
  approved:  "bg-red-100 border-red-400 text-red-700 cursor-not-allowed",
};

export default function NumberGrid() {
  const { user } = useLiff();
  const [numbers, setNumbers] = useState<Record<string, LotteryNumber>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 นาที

  // Real-time Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "lottery_numbers"), (snap) => {
      const map: Record<string, LotteryNumber> = {};
      snap.forEach((doc) => {
        map[doc.id] = { number: doc.id, ...doc.data() } as LotteryNumber;
      });
      setNumbers(map);
    });
    return () => unsub();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (selected.length === 0) { setTimeLeft(300); return; }
    if (timeLeft <= 0) {
      selected.forEach((n) => unlockNumber(n, user?.userId || ""));
      setSelected([]);
      setTimeLeft(300);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [selected, timeLeft]);

  const getEffectiveStatus = (num: LotteryNumber): NumberStatus => {
    if (num.status === "locked" && num.lockExpiresAt) {
      const expiry = num.lockExpiresAt instanceof Date
        ? num.lockExpiresAt
        : (num.lockExpiresAt as unknown as Timestamp).toDate();
      if (new Date() > expiry) return "available";
    }
    return num.status;
  };

  const handleSelect = async (numStr: string) => {
    if (!user) return;
    const current = numbers[numStr];
    if (!current) return;

    if (selected.includes(numStr)) {
      await unlockNumber(numStr, user.userId);
      setSelected((s) => s.filter((n) => n !== numStr));
      return;
    }

    setLoading(numStr);
    const result = await lockNumber(numStr, user.userId);
    setLoading(null);
    if (result.success) {
      setSelected((s) => [...s, numStr]);
    } else {
      alert(result.error);
    }
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");
  const timerColor = timeLeft < 60 ? "text-red-500" : "text-green-600";

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-4 text-center shadow-md">
        <h1 className="text-lg font-bold tracking-wide">🍀 RichNonStop168</h1>
        <p className="text-green-100 text-xs mt-0.5">เลือกเลขโชคดีของคุณ</p>
      </div>

      <div className="max-w-md mx-auto px-3 py-4">
        {/* User info */}
        {user && (
          <div className="flex items-center gap-2 mb-3 bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
              {user.displayName.charAt(0)}
            </div>
            <span className="text-sm text-gray-600">{user.displayName}</span>
            {selected.length > 0 && (
              <span className={`ml-auto text-xs font-mono font-bold ${timerColor}`}>
                ⏱ {mins}:{secs}
              </span>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-3 mb-3 text-xs justify-center">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white border border-gray-300 inline-block"/> ว่าง</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block"/> เลือกแล้ว</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 inline-block"/> กำลังจอง</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block"/> จองแล้ว</span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-10 gap-1 bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
          {Array.from({ length: 100 }, (_, i) => {
            const num = i.toString().padStart(2, "0");
            const data = numbers[num];
            const effectiveStatus = data ? getEffectiveStatus(data) : "available";
            const isSelected = selected.includes(num);
            const isLoading = loading === num;
            const isOwn = data?.lockedBy === user?.userId;
            const canClick = effectiveStatus === "available" || isOwn;

            return (
              <button
                key={num}
                onClick={canClick ? () => handleSelect(num) : undefined}
                disabled={isLoading}
                className={`
                  aspect-square rounded-lg border text-xs font-semibold
                  flex items-center justify-center
                  transition-all duration-150 select-none
                  ${isSelected
                    ? "bg-green-500 border-green-600 text-white scale-105 shadow-md"
                    : statusStyle[effectiveStatus]
                  }
                  ${isLoading ? "opacity-50" : ""}
                `}
              >
                {isLoading ? "•" : num}
              </button>
            );
          })}
        </div>

        {/* Selected summary */}
        {selected.length > 0 ? (
          <div className="mt-4 bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden">
            <div className="bg-green-500 px-4 py-2">
              <p className="text-white text-sm font-semibold">เลขที่เลือก ({selected.length} เลข)</p>
            </div>
            <div className="px-4 py-3">
              <div className="flex flex-wrap gap-2 mb-3">
                {selected.map((n) => (
                  <span key={n} className="bg-green-100 text-green-700 text-sm font-bold px-2 py-1 rounded-lg">
                    {n}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                <span>ราคาต่อเลข</span>
                <span className="font-semibold text-gray-700">100 บาท</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="font-semibold">ยอดรวม</span>
                <span className="font-bold text-green-600 text-lg">{selected.length * 100} บาท</span>
              </div>
              <button className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold py-3 rounded-xl transition-all shadow-sm">
                ยืนยันและส่งสลิป →
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-400 text-xs mt-4">กดเลือกเลขที่ต้องการได้เลย</p>
        )}
      </div>
    </div>
  );
}