export type NumberStatus = "available" | "locked" | "reserved" | "approved";

export interface LotteryNumber {
  number: string;
  status: NumberStatus;
  lockedBy?: string;
  lockedAt?: Date;
  lockExpiresAt?: Date;
  reservedBy?: string;
  slipUrl?: string;
  price: number;
}

export interface Reservation {
  id: string;
  lineUserId: string;
  lineDisplayName: string;
  lineAvatarUrl?: string;
  numbers: string[];
  totalAmount: number;
  status: "pending" | "approved" | "rejected";
  slipUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LiffUser {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}