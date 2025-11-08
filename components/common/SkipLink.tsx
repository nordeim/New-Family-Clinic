// components/common/SkipLink.tsx

import React from 'react';

export function SkipLink({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-white focus:text-primary focus:border-2 focus:border-primary focus:rounded-lg"
    >
      Skip to main content
    </a>
  );
}
