// @/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility function to conditionally join class names together.
 * It also handles merging Tailwind CSS classes without style conflicts.
 * @param inputs - A list of class names or conditional class names.
 * @returns A single string of merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely extract `isLoading` state from a mutation-like object returned by
 * various react-query / tRPC hooks without using `any`.
 *
 * The function accepts `unknown` and checks for common shapes:
 * - `{ isLoading: boolean }`
 * - `{ status: string }` where `status === 'loading'`
 */
export function getMutationLoading(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;

  if (typeof o.isLoading === "boolean") return o.isLoading as boolean;
  if (typeof o.status === "string") return (o.status as string) === "loading";

  return false;
}
