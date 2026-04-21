import type { Metadata } from "next";
import "./globals.css";
import LiffProvider from "@/components/LiffProvider";

export const metadata: Metadata = {
  title: "RichNonStop168",
  description: "ระบบจองเลขหวย",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <LiffProvider>
          {children}
        </LiffProvider>
      </body>
    </html>
  );
}