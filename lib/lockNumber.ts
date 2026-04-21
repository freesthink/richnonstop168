import { db } from "./firebase";
import {
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

const LOCK_TIMEOUT_MS = 5 * 60 * 1000;

export const lockNumber = async (
  number: string,
  lineUserId: string
): Promise<{ success: boolean; error?: string }> => {
  const ref = doc(db, "lottery_numbers", number);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error("ไม่พบเลขนี้");

      const data = snap.data();

      if (data.status === "locked" && data.lockExpiresAt) {
        const expiry = (data.lockExpiresAt as Timestamp).toDate();
        if (new Date() < expiry && data.lockedBy !== lineUserId) {
          throw new Error("เลขนี้ถูกจองแล้ว");
        }
      }

      if (data.status === "reserved" || data.status === "approved") {
        throw new Error("เลขนี้ถูกจองแล้ว");
      }

      const expiresAt = new Date(Date.now() + LOCK_TIMEOUT_MS);
      tx.update(ref, {
        status: "locked",
        lockedBy: lineUserId,
        lockedAt: serverTimestamp(),
        lockExpiresAt: Timestamp.fromDate(expiresAt),
      });
    });
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" };
  }
};

export const unlockNumber = async (number: string, lineUserId: string) => {
  const ref = doc(db, "lottery_numbers", number);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.data()?.lockedBy === lineUserId) {
        tx.update(ref, {
          status: "available",
          lockedBy: null,
          lockedAt: null,
          lockExpiresAt: null,
        });
      }
    });
  } catch (e) {
    console.error("unlock error", e);
  }
};