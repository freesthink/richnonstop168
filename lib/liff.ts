import type { Liff } from "@line/liff";

let liffInstance: Liff | null = null;

export const initLiff = async (): Promise<Liff> => {
  if (liffInstance) return liffInstance;
  const liff = (await import("@line/liff")).default;
  await liff.init({
    liffId: process.env.NEXT_PUBLIC_LIFF_ID!,
    withLoginOnExternalBrowser: true,
  });
  liffInstance = liff;
  return liff;
};

export const getLiffProfile = async () => {
  const liff = await initLiff();
  if (!liff.isLoggedIn()) {
    liff.login();
    return null;
  }
  return liff.getProfile();
};

export const getMockUser = () => ({
  userId: "mock_user_001",
  displayName: "Test User (Dev)",
  pictureUrl: "",
});