"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { lockNumber, unlockNumber } from "@/lib/lockNumber";
import { useLiff } from "./LiffProvider";
import type { LotteryNumber, NumberStatus } from "@/types";

export default function NumberGrid() {
  const { user } = useLiff();
  const [numbers, setNumbers] = useState<Record<string, LotteryNumber>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300);

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
    if (result.success) setSelected((s) => [...s, numStr]);
    else alert(result.error);
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", color: "#fff", fontFamily: "sans-serif" }}>

      {/* Hero Section */}
      <div style={{
        background: "linear-gradient(135deg, #1a1000 0%, #0a0a0a 50%, #1a1000 100%)",
        borderBottom: "1px solid #8B6914",
        padding: "24px 16px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Crown */}
        <div style={{ fontSize: 36, marginBottom: 4 }}>👑</div>
        <h1 style={{
          fontSize: 28, fontWeight: 900, letterSpacing: 2,
          background: "linear-gradient(180deg, #FFD700 0%, #B8860B 50%, #FFD700 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          margin: 0,
        }}>RichNonStop168</h1>
        <div style={{
          fontSize: 40, fontWeight: 900, letterSpacing: 4,
          background: "linear-gradient(180deg, #FFD700 0%, #FFA500 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          lineHeight: 1.1,
        }}>00 - 99</div>
        <div style={{
          display: "inline-block",
          border: "1px solid #B8860B",
          borderRadius: 20,
          padding: "4px 16px",
          fontSize: 13,
          color: "#FFD700",
          marginTop: 6,
          background: "rgba(184,134,11,0.15)",
        }}>ราคาเบอร์ละ 100 บาท</div>

        {/* Features row */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          {[
            { icon: "✅", text: "เบอร์สวย จ่ายง่าย" },
            { icon: "🔒", text: "ปลอดภัย 100%" },
            { icon: "⚡", text: "ได้รับทันที" },
          ].map((f) => (
            <div key={f.text} style={{
              background: "rgba(255,215,0,0.08)",
              border: "1px solid rgba(255,215,0,0.2)",
              borderRadius: 10,
              padding: "6px 12px",
              fontSize: 11,
              color: "#FFD700",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {f.icon} {f.text}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px" }}>

        {/* User + Timer */}
        {user && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(255,215,0,0.05)",
            border: "1px solid rgba(255,215,0,0.15)",
            borderRadius: 12, padding: "8px 14px", marginBottom: 14,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "linear-gradient(135deg, #FFD700, #B8860B)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, color: "#000", fontSize: 13,
              }}>{user.displayName.charAt(0)}</div>
              <span style={{ fontSize: 13, color: "#ccc" }}>{user.displayName}</span>
            </div>
            {selected.length > 0 && (
              <div style={{
                fontSize: 13, fontWeight: 700, fontFamily: "monospace",
                color: timeLeft < 60 ? "#ff4444" : "#FFD700",
              }}>⏱ {mins}:{secs}</div>
            )}
          </div>
        )}

        {/* Section Title */}
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, #B8860B)" }} />
            <span style={{ color: "#FFD700", fontSize: 15, fontWeight: 700 }}>✦ เลือกเบอร์ทองของคุณ ✦</span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, #B8860B)" }} />
          </div>
          {/* Legend */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
            {[
              { color: "#1a1a1a", border: "#444", label: "ว่าง" },
              { color: "#1a3a1a", border: "#22c55e", label: "เลือกแล้ว" },
              { color: "#2a2000", border: "#B8860B", label: "กำลังจอง" },
              { color: "#2a0000", border: "#ef4444", label: "จองแล้ว" },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#aaa" }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, border: `1px solid ${l.border}` }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Number Grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 5,
          background: "rgba(255,215,0,0.03)",
          border: "1px solid rgba(255,215,0,0.1)",
          borderRadius: 16, padding: 10,
        }}>
          {Array.from({ length: 100 }, (_, i) => {
            const num = i.toString().padStart(2, "0");
            const data = numbers[num];
            const status = data ? getEffectiveStatus(data) : "available";
            const isSelected = selected.includes(num);
            const isLoading = loading === num;
            const isOwn = data?.lockedBy === user?.userId;
            const canClick = status === "available" || isOwn;

            let bg = "#1a1a1a", border = "#333", color = "#ccc";
            if (isSelected)      { bg = "#14532d"; border = "#22c55e"; color = "#4ade80"; }
            else if (status === "locked")   { bg = "#2a2000"; border = "#B8860B"; color = "#FFD700"; }
            else if (status === "reserved") { bg = "#2a0000"; border = "#ef4444"; color = "#f87171"; }
            else if (status === "approved") { bg = "#3a0000"; border = "#dc2626"; color = "#fca5a5"; }

            return (
              <button
                key={num}
                onClick={canClick ? () => handleSelect(num) : undefined}
                disabled={isLoading}
                style={{
                  aspectRatio: "1", borderRadius: 8,
                  border: `1px solid ${border}`,
                  background: isSelected
                    ? "linear-gradient(135deg, #14532d, #166534)"
                    : bg,
                  color,
                  fontSize: 11, fontWeight: 700,
                  cursor: canClick ? "pointer" : "not-allowed",
                  transition: "all 0.15s",
                  transform: isSelected ? "scale(1.08)" : "scale(1)",
                  boxShadow: isSelected ? `0 0 8px rgba(34,197,94,0.4)` : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                {isLoading ? "•" : num}
              </button>
            );
          })}
        </div>

        {/* Selected Summary */}
        {selected.length > 0 ? (
          <div style={{
            marginTop: 16,
            border: "1px solid #B8860B",
            borderRadius: 16,
            overflow: "hidden",
            background: "#0d0d0d",
          }}>
            <div style={{
              background: "linear-gradient(135deg, #B8860B, #8B6914)",
              padding: "10px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>
                🛒 เบอร์ที่เลือก ({selected.length} เบอร์)
              </span>
              <span style={{ color: "#fff", fontSize: 12, fontFamily: "monospace" }}>
                ⏱ {mins}:{secs}
              </span>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {selected.map((n) => (
                  <span key={n} style={{
                    background: "rgba(255,215,0,0.1)",
                    border: "1px solid #B8860B",
                    color: "#FFD700",
                    padding: "3px 10px",
                    borderRadius: 8,
                    fontSize: 14, fontWeight: 700,
                  }}>{n}</span>
                ))}
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                borderTop: "1px solid #222", paddingTop: 12, marginBottom: 14,
              }}>
                <span style={{ color: "#aaa", fontSize: 13 }}>ยอดรวมทั้งหมด</span>
                <span style={{
                  fontSize: 20, fontWeight: 900,
                  background: "linear-gradient(180deg, #FFD700, #B8860B)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>{selected.length * 100} บาท</span>
              </div>
              <button style={{
                width: "100%",
                background: "linear-gradient(135deg, #FFD700 0%, #B8860B 50%, #FFD700 100%)",
                border: "none", borderRadius: 12,
                padding: "14px",
                fontSize: 16, fontWeight: 900, color: "#000",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(255,215,0,0.3)",
                letterSpacing: 1,
              }}>
                ✅ ยืนยันและส่งสลิป
              </button>
            </div>
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "#555", fontSize: 12, marginTop: 12 }}>
            กดเลือกเบอร์ที่ต้องการได้เลย
          </p>
        )}

        {/* How to order */}
        <div style={{ marginTop: 24, marginBottom: 8 }}>
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, #B8860B)" }} />
              <span style={{ color: "#FFD700", fontSize: 14, fontWeight: 700 }}>✦ วิธีการสั่งซื้อ ✦</span>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, #B8860B)" }} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            {[
              { num: "1", icon: "🔍", label: "เลือกเบอร์" },
              { num: "2", icon: "🛒", label: "กดยืนยัน" },
              { num: "3", icon: "💳", label: "ชำระ 100 บาท" },
              { num: "4", icon: "⚡", label: "รับเบอร์ทันที" },
            ].map((s) => (
              <div key={s.num} style={{
                flex: 1, textAlign: "center",
                background: "rgba(255,215,0,0.05)",
                border: "1px solid rgba(255,215,0,0.1)",
                borderRadius: 12, padding: "10px 4px",
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "linear-gradient(135deg, #FFD700, #B8860B)",
                  color: "#000", fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 6px",
                }}>{s.num}</div>
                <div style={{ fontSize: 18 }}>{s.icon}</div>
                <div style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 24, textAlign: "center",
          borderTop: "1px solid #222", paddingTop: 16,
          color: "#555", fontSize: 11,
        }}>
          © 2024 RichNonStop168 · บริการด้วยใจ 24 ชม.
        </div>
      </div>
    </div>
  );
}