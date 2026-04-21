"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { LiffUser } from "@/types";

interface LiffContextType {
  user: LiffUser | null;
  loading: boolean;
  error: string | null;
}

const LiffContext = createContext<LiffContextType>({
  user: null,
  loading: true,
  error: null,
});

export const useLiff = () => useContext(LiffContext);

export default function LiffProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<LiffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const useDev = process.env.NEXT_PUBLIC_USE_LIFF_IN_DEV === "true";
        if (useDev) {
          const { getMockUser } = await import("@/lib/liff");
          setUser(getMockUser());
          return;
        }
        const { getLiffProfile } = await import("@/lib/liff");
        const profile = await getLiffProfile();
        if (profile) {
          setUser({
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
            statusMessage: profile.statusMessage,
          });
        }
      } catch (e) {
        setError("ไม่สามารถเชื่อมต่อ LINE ได้");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  return (
    <LiffContext.Provider value={{ user, loading, error }}>
      {children}
    </LiffContext.Provider>
  );
}