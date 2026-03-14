import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSessionAuth(id: string) {
  try {
    return JSON.parse(localStorage.getItem(`session_${id}`) || "{}");
  } catch {
    return {};
  }
}
