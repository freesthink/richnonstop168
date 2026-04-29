"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { lockNumber, unlockNumber } from "@/lib/lockNumber";
import { useLiff } from "./LiffProvider";
import type { LotteryNumber, NumberStatus } from "@/types";

export default function NumberGrid() {
  const { user } = useLiff();
  const router = useRouter();
  const [numbers, setNumbers] = useState<Record<string, LotteryNumber>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "lottery_numbers"), (snap) => {
      const map: Record<string, LotteryNumber> = {};
      snap.forEach((doc) => { map[doc.id] = { number: doc.id, ...doc.data() } as LotteryNumber; });
      setNumbers(map);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (selected.length === 0) { setTimeLeft(300); return; }
    if (timeLeft <= 0) {
      selected.forEach((n) => unlockNumber(n, user?.userId || ""));
      setSelected([]); setTimeLeft(300); return;
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

  const G = {
    gold: "linear-gradient(180deg, #FFD700 0%, #B8860B 60%, #FFD700 100%)",
    goldText: { background: "linear-gradient(180deg, #FFD700 0%, #FFA500 100%)", WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" as const },
    card: { background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.15)", borderRadius: 16 } as React.CSSProperties,
    divider: (dir = "right") => ({ flex: 1, height: 1, background: `linear-gradient(to ${dir}, transparent, #B8860B)` }) as React.CSSProperties,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#fff", fontFamily: "'Sarabun', sans-serif" }}>

      {/* HERO */}
      <div style={{
        background: "linear-gradient(180deg, #1a0f00 0%, #0d0800 60%, #080808 100%)",
        padding: "28px 20px 24px",
        textAlign: "center",
        borderBottom: "1px solid rgba(184,134,11,0.3)",
        position: "relative",
      }}>
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: 200, height: 200,
          background: "radial-gradient(circle, rgba(255,215,0,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ fontSize: 44, lineHeight: 1, marginBottom: 4 }}>👑</div>
        <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: 3, ...G.goldText }}>RichNonStop168</div>
        <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: 8, lineHeight: 1.1, ...G.goldText, margin: "4px 0" }}>00-99</div>
        <div style={{
          display: "inline-block",
          background: "linear-gradient(135deg, rgba(184,134,11,0.3), rgba(255,215,0,0.1))",
          border: "1px solid #B8860B", borderRadius: 99, padding: "5px 20px",
          fontSize: 13, color: "#FFD700", fontWeight: 600, marginBottom: 16,
        }}>💰 ราคาเบอร์ละ 100 บาท</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {[
            { icon: "🏆", title: "เบอร์สวย จ่ายง่าย", sub: "เสริมความมั่นใจ" },
            { icon: "🔒", title: "ปลอดภัย 100%", sub: "โอนแล้วได้ทันที" },
            { icon: "⚡", title: "ได้รับทันที", sub: "หลังชำระเงิน" },
            { icon: "🎧", title: "บริการ 24 ชม.", sub: "พร้อมดูแลทุกขั้นตอน" },
          ].map((f) => (
            <div key={f.title} style={{
              background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.2)",
              borderRadius: 12, padding: "8px 12px", textAlign: "center", minWidth: 120,
            }}>
              <div style={{ fontSize: 20 }}>{f.icon}</div>
              <div style={{ fontSize: 11, color: "#FFD700", fontWeight: 700, marginTop: 2 }}>{f.title}</div>
              <div style={{ fontSize: 10, color: "#888" }}>{f.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 12px" }}>

        {/* USER BAR */}
        {user && (
          <div style={{ ...G.card, display: "flex", alignItems: "center", padding: "10px 14px", marginBottom: 16 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: G.gold,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, color: "#000", fontSize: 14, flexShrink: 0,
            }}>{user.displayName.charAt(0)}</div>
            <span style={{ fontSize: 13, color: "#ccc", marginLeft: 10 }}>{user.displayName}</span>
            {selected.length > 0 && (
              <div style={{
                marginLeft: "auto", fontSize: 14, fontWeight: 700, fontFamily: "monospace",
                color: timeLeft < 60 ? "#ff4444" : "#FFD700",
              }}>⏱ {mins}:{secs}</div>
            )}
          </div>
        )}

        {/* SECTION TITLE */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={G.divider()} />
          <span style={{ color: "#FFD700", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>✦ เลือกเบอร์ทองของคุณ ✦</span>
          <div style={G.divider("left")} />
        </div>

        {/* LEGEND */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 12, flexWrap: "wrap" }}>
          {[
            { bg: "#1e1e1e", border: "#444", label: "ว่าง" },
            { bg: "#14532d", border: "#22c55e", label: "เลือกแล้ว" },
            { bg: "#2a2000", border: "#B8860B", label: "กำลังจอง" },
            { bg: "#2a0000", border: "#ef4444", label: "จองแล้ว" },
          ].map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#999" }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: l.bg, border: `1.5px solid ${l.border}`, flexShrink: 0 }} />
              {l.label}
            </div>
          ))}
        </div>

        {/* NUMBER GRID */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8,
          background: "rgba(255,215,0,0.03)",
          border: "1px solid rgba(255,215,0,0.12)",
          borderRadius: 20, padding: 12, marginBottom: 16,
        }}>
          {Array.from({ length: 100 }, (_, i) => {
            const num = i.toString().padStart(2, "0");
            const data = numbers[num];
            const status = data ? getEffectiveStatus(data) : "available";
            const isSelected = selected.includes(num);
            const isLoading = loading === num;
            const isOwn = data?.lockedBy === user?.userId;
            const canClick = status === "available" || isOwn;

            let bg = "#1e1e1e", border = "#333", color = "#ccc", shadow = "none";
            if (isSelected)               { bg = "linear-gradient(135deg,#14532d,#166534)"; border = "#22c55e"; color = "#4ade80"; shadow = "0 0 12px rgba(34,197,94,0.35)"; }
            else if (status === "locked")   { bg = "#2a2000"; border = "#B8860B"; color = "#FFD700"; }
            else if (status === "reserved") { bg = "#2a0000"; border = "#ef4444"; color = "#f87171"; }
            else if (status === "approved") { bg = "#3a0000"; border = "#dc2626"; color = "#fca5a5"; }

            return (
              <button key={num}
                onClick={canClick ? () => handleSelect(num) : undefined}
                disabled={isLoading}
                style={{
                  padding: "10px 4px", borderRadius: 10,
                  border: `1.5px solid ${border}`, background: bg, color,
                  fontSize: 16, fontWeight: 800,
                  cursor: canClick ? "pointer" : "not-allowed",
                  transition: "all 0.15s",
                  transform: isSelected ? "scale(1.06)" : "scale(1)",
                  boxShadow: shadow,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 2,
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                <span>{isLoading ? "•" : num}</span>
                <span style={{ fontSize: 9, color: isSelected ? "#86efac" : "#555", fontWeight: 400 }}>100 บ.</span>
              </button>
            );
          })}
        </div>

        {/* SUMMARY */}
        {selected.length > 0 ? (
          <div style={{ border: "1px solid #B8860B", borderRadius: 20, overflow: "hidden", marginBottom: 24 }}>
            <div style={{
              background: "linear-gradient(135deg, #B8860B 0%, #8B6914 50%, #B8860B 100%)",
              padding: "12px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontWeight: 800, color: "#fff", fontSize: 15 }}>🛒 เบอร์ที่เลือก ({selected.length} เบอร์)</span>
              <span style={{ color: "#fff", fontSize: 13, fontFamily: "monospace", fontWeight: 700 }}>⏱ {mins}:{secs}</span>
            </div>
            <div style={{ background: "#0d0d0d", padding: 16 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                {selected.map((n) => (
                  <span key={n} style={{
                    background: "rgba(255,215,0,0.1)", border: "1px solid #B8860B",
                    color: "#FFD700", padding: "4px 14px", borderRadius: 10,
                    fontSize: 16, fontWeight: 800,
                  }}>{n}</span>
                ))}
              </div>
              <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#888", fontSize: 13 }}>ราคาต่อเบอร์</span>
                  <span style={{ color: "#ccc", fontSize: 13 }}>100 บาท</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>ยอดรวมทั้งหมด</span>
                  <span style={{ fontSize: 26, fontWeight: 900, ...G.goldText }}>{selected.length * 100} บาท</span>
                </div>
                <button
                  onClick={() => router.push(`/confirm?numbers=${selected.join(",")}`)}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg,#FFD700 0%,#FFA500 50%,#FFD700 100%)",
                    border: "none", borderRadius: 14, padding: "16px",
                    fontSize: 17, fontWeight: 900, color: "#000",
                    cursor: "pointer",
                    boxShadow: "0 4px 24px rgba(255,215,0,0.4)",
                    letterSpacing: 1,
                  }}
                >
                  ✅ ยืนยันและส่งสลิป
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "#444", fontSize: 12, marginBottom: 24 }}>
            ✨ กดเลือกเบอร์ที่ต้องการได้เลย
          </p>
        )}

        {/* HOW TO ORDER */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={G.divider()} />
            <span style={{ color: "#FFD700", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>✦ วิธีการสั่งซื้อ ✦</span>
            <div style={G.divider("left")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[
              { num: "1", icon: "🔍", label: "เลือกเบอร์", sub: "00-99 ที่ชอบ" },
              { num: "2", icon: "🛒", label: "กดยืนยัน", sub: "ตรวจสอบเบอร์" },
              { num: "3", icon: "💳", label: "ชำระเงิน", sub: "100 บาท/เบอร์" },
              { num: "4", icon: "⚡", label: "รับเบอร์", sub: "ได้รับทันที" },
            ].map((s, idx) => (
              <div key={s.num} style={{ ...G.card, padding: "12px 6px", textAlign: "center", position: "relative" }}>
                {idx < 3 && (
                  <div style={{ position: "absolute", right: -8, top: "50%", transform: "translateY(-50%)", color: "#B8860B", fontSize: 12, zIndex: 1 }}>›</div>
                )}
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: G.gold, color: "#000", fontSize: 11, fontWeight: 900,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 6px",
                }}>{s.num}</div>
                <div style={{ fontSize: 22 }}>{s.icon}</div>
                <div style={{ fontSize: 11, color: "#FFD700", fontWeight: 700, marginTop: 4 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16, textAlign: "center", color: "#444", fontSize: 11 }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>👑</div>
          <div style={{ ...G.goldText, fontSize: 13, fontWeight: 700 }}>RichNonStop168</div>
          <div style={{ marginTop: 4 }}>เบอร์สวย จ่ายง่าย เสริมความมั่นใจ</div>
          <div style={{ marginTop: 8 }}>© 2024 RichNonStop168 · บริการด้วยใจ 24 ชม.</div>
        </div>

      </div>
    </div>
  );
}