'use client';

import * as React from 'react';

export function EmptyInsightsIllustration({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 160"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M40 120V70l30-25 30 20 30-35 30 50v40" />
      <path d="M40 120h120" />
      <path d="M40 70h30v50H40M100 65h30v55h-30M160 85h30v35h-30" opacity="0.5" />
    </svg>
  );
}
