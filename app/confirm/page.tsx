"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useLiff } from "@/components/LiffProvider";

export default function ConfirmPage() {
  const { user } = useLiff();
  const router = useRouter();
  const searchParams = useSearchParams();
  const numbers = searchParams.get("numbers")?.split(",") || [];
  const total = numbers.length * 100;

  const [slip, setSlip] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const G = {
    gold: "linear-gradient(180deg,#FFD700 0%,#B8860B 60%,#FFD700 100%)",
    goldText: { background: "linear-gradient(180deg,#FFD700 0%,#FFA500 100%)", WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" as const },
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSlip(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!user || !slip || numbers.length === 0) return;
    setUploading(true);
    try {
      // Upload slip to Firebase Storage
      const storageRef = ref(storage, `slips/${user.userId}_${Date.now()}`);
      await uploadBytes(storageRef, slip);
      const slipUrl = await getDownloadURL(storageRef);

      // Save reservation to Firestore
      await addDoc(collection(db, "reservations"), {
        lineUserId: user.userId,
        lineDisplayName: user.displayName,
        numbers,
        totalAmount: total,
        status: "pending",
        slipUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update number status to reserved
      for (const num of numbers) {
        await updateDoc(doc(db, "lottery_numbers", num), {
          status: "reserved",
          reservedBy: user.userId,
        });
      }

      setDone(true);
    } catch (e) {
      alert("เกิดข้อผิดพลาด: " + (e instanceof Error ? e.message : "unknown"));
    } finally {
      setUploading(false);
    }
  };

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: "#080808", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ fontSize: 64 }}>🎉</div>
        <div style={{ fontSize: 24, fontWeight: 900, ...G.goldText, marginTop: 12 }}>ส่งสลิปสำเร็จ!</div>
        <div style={{ color: "#888", fontSize: 13, marginTop: 8, textAlign: "center" }}>
          รอแอดมินตรวจสอบสลิปและยืนยันการจอง
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16 }}>
          {numbers.map((n) => (
            <span key={n} style={{
              background: "rgba(255,215,0,0.1)", border: "1px solid #B8860B",
              color: "#FFD700", padding: "4px 14px", borderRadius: 10,
              fontSize: 18, fontWeight: 900,
            }}>{n}</span>
          ))}
        </div>
        <button
          onClick={() => router.push("/")}
          style={{
            marginTop: 24, background: G.gold, border: "none",
            borderRadius: 14, padding: "14px 32px",
            fontSize: 15, fontWeight: 900, color: "#000", cursor: "pointer",
          }}
        >กลับหน้าหลัก</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#fff", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(180deg,#1a0f00,#0d0800)",
        borderBottom: "1px solid rgba(184,134,11,0.3)",
        padding: "16px", textAlign: "center",
      }}>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>ยืนยันการจอง</div>
        <div style={{ fontSize: 22, fontWeight: 900, ...G.goldText }}>👑 RichNonStop168</div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>

        {/* Order Summary */}
        <div style={{
          background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.15)",
          borderRadius: 16, padding: 16, marginBottom: 16,
        }}>
          <div style={{ color: "#FFD700", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📋 สรุปการจอง</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {numbers.map((n) => (
              <span key={n} style={{
                background: "rgba(255,215,0,0.1)", border: "1px solid #B8860B",
                color: "#FFD700", padding: "4px 14px", borderRadius: 10,
                fontSize: 16, fontWeight: 900,
              }}>{n}</span>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #1e1e1e", paddingTop: 10 }}>
            <span style={{ color: "#888" }}>ยอดที่ต้องโอน</span>
            <span style={{ fontSize: 22, fontWeight: 900, ...G.goldText }}>{total} บาท</span>
          </div>
        </div>

        {/* Bank Info */}
        <div style={{
          background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.15)",
          borderRadius: 16, padding: 16, marginBottom: 16,
        }}>
          <div style={{ color: "#FFD700", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>🏦 ข้อมูลการโอนเงิน</div>
          {[
            { label: "ธนาคาร", value: "กสิกรไทย (KBANK)" },
            { label: "ชื่อบัญชี", value: "ร้าน RichNonStop168" },
            { label: "เลขบัญชี", value: "xxx-x-xxxxx-x" },
          ].map((item) => (
            <div key={item.label} style={{
              display: "flex", justifyContent: "space-between",
              padding: "6px 0", borderBottom: "1px solid #1a1a1a",
            }}>
              <span style={{ color: "#888", fontSize: 13 }}>{item.label}</span>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Upload Slip */}
        <div style={{
          background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.15)",
          borderRadius: 16, padding: 16, marginBottom: 16,
        }}>
          <div style={{ color: "#FFD700", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📎 แนบสลิปการโอนเงิน</div>

          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

          {preview ? (
            <div style={{ textAlign: "center" }}>
              <img src={preview} alt="slip" style={{ width: "100%", maxHeight: 300, objectFit: "contain", borderRadius: 12, marginBottom: 10 }} />
              <button
                onClick={() => { setSlip(null); setPreview(null); }}
                style={{ color: "#888", background: "none", border: "none", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
              >เปลี่ยนรูป</button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                width: "100%", padding: "32px",
                background: "rgba(255,215,0,0.03)",
                border: "2px dashed rgba(255,215,0,0.2)",
                borderRadius: 12, color: "#888",
                fontSize: 13, cursor: "pointer",
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 8,
              }}
            >
              <span style={{ fontSize: 32 }}>📷</span>
              <span>แตะเพื่อเลือกรูปสลิป</span>
            </button>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!slip || uploading}
          style={{
            width: "100%",
            background: slip && !uploading
              ? "linear-gradient(135deg,#FFD700 0%,#FFA500 50%,#FFD700 100%)"
              : "#333",
            border: "none", borderRadius: 14,
            padding: "16px",
            fontSize: 17, fontWeight: 900,
            color: slip ? "#000" : "#666",
            cursor: slip ? "pointer" : "not-allowed",
            boxShadow: slip ? "0 4px 24px rgba(255,215,0,0.3)" : "none",
          }}
        >
          {uploading ? "⏳ กำลังส่ง..." : "✅ ส่งสลิปยืนยันการจอง"}
        </button>

        <p style={{ textAlign: "center", color: "#444", fontSize: 11, marginTop: 12 }}>
          หลังส่งสลิปแล้ว รอแอดมินตรวจสอบภายใน 5-10 นาที
        </p>
      </div>
    </div>
  );
}