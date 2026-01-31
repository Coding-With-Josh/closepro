'use client';

import * as React from 'react';

export function EmptyOffersIllustration({ className, ...props }: React.SVGProps<SVGSVGElement>) {
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
      <rect x="50" y="30" width="100" height="100" rx="8" />
      <path d="M70 55h60M70 75h45M70 95h55" />
      <circle cx="155" cy="55" r="8" />
    </svg>
  );
}
