"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { lockNumber, unlockNumber } from "@/lib/lockNumber";
import { useLiff } from "./LiffProvider";
import type { LotteryNumber, NumberStatus } from "@/types";
import NumberCell from "./NumberCell";

export default function NumberGrid() {
  const { user } = useLiff();
  const [numbers, setNumbers] = useState<Record<string, LotteryNumber>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

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

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h2 className="text-center text-base font-semibold mb-1">เลือกเลขโชคดี</h2>
      <p className="text-center text-xs text-gray-400 mb-3">
        เลือกแล้ว {selected.length} เลข
      </p>

      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 100 }, (_, i) => {
          const num = i.toString().padStart(2, "0");
          const data = numbers[num];
          const effectiveStatus = data ? getEffectiveStatus(data) : "available";
          return (
            <NumberCell
              key={num}
              number={num}
              status={effectiveStatus}
              isSelected={selected.includes(num)}
              isLoading={loading === num}
              isOwn={data?.lockedBy === user?.userId}
              onClick={() => handleSelect(num)}
            />
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200">
          <p className="text-sm text-green-700 font-medium">
            เลขที่เลือก: {selected.join(", ")}
          </p>
          <p className="text-xs text-green-500 mt-1">
            ⏱ กรุณายืนยันภายใน 5 นาที
          </p>
        </div>
      )}
    </div>
  );
}