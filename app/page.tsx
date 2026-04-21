"use client";
import { useLiff } from "@/components/LiffProvider";
import NumberGrid from "@/components/NumberGrid";

export default function Home() {
  const { user, loading, error } = useLiff();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">กำลังโหลด...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">กรุณาเข้าสู่ระบบ</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-6">
      <div className="text-center mb-4">
        <p className="text-xs text-gray-400">สวัสดี {user.displayName}</p>
      </div>
      <NumberGrid />
    </main>
  );
}