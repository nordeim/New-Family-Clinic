// components/ui/StarRating.tsx
import * as React from "react";

export function StarRating({
  rating,
  onRatingChange,
  max = 5,
}: {
  rating: number;
  onRatingChange: (r: number) => void;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => {
        const idx = i + 1;
        return (
          <button
            key={idx}
            type="button"
            aria-label={`Rate ${idx}`}
            onClick={() => onRatingChange(idx)}
            className={`text-xl ${idx <= rating ? "text-yellow-500" : "text-neutral-300"}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export default StarRating;
