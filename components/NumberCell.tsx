"use client";
import type { NumberStatus } from "@/types";

interface Props {
  number: string;
  status: NumberStatus;
  isSelected: boolean;
  isLoading: boolean;
  isOwn: boolean;
  onClick: () => void;
}

const statusStyle: Record<NumberStatus, string> = {
  available: "bg-white border-gray-200 active:bg-green-50 cursor-pointer hover:border-green-400",
  locked:    "bg-yellow-50 border-yellow-300 cursor-not-allowed",
  reserved:  "bg-red-100 border-red-300 cursor-not-allowed",
  approved:  "bg-red-200 border-red-400 cursor-not-allowed",
};

const statusText: Record<NumberStatus, string> = {
  available: "text-gray-700",
  locked:    "text-yellow-700",
  reserved:  "text-red-700",
  approved:  "text-red-800",
};

export default function NumberCell({ number, status, isSelected, isLoading, isOwn, onClick }: Props) {
  const canClick = status === "available" || isOwn;

  const boxStyle = isSelected
    ? "bg-green-500 border-green-600 cursor-pointer scale-105 shadow-sm"
    : statusStyle[status];

  const textStyle = isSelected ? "text-white font-bold" : statusText[status];

  return (
    <button
      onClick={canClick ? onClick : undefined}
      disabled={isLoading}
      className={`
        aspect-square rounded-lg border text-xs font-semibold
        flex items-center justify-center
        transition-all duration-150 select-none
        ${boxStyle} ${textStyle}
        ${isLoading ? "opacity-50 scale-95" : ""}
      `}
    >
      {isLoading ? "•" : number}
    </button>
  );
}