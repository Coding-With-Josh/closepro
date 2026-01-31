'use client';

import * as React from 'react';

export function EmptyTeamIllustration({ className, ...props }: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="100" cy="50" r="22" />
      <path d="M65 140c0-19 16-35 35-35s35 16 35 35" />
      <circle cx="55" cy="65" r="15" />
      <path d="M25 130c0-17 13-30 30-30" />
      <circle cx="145" cy="65" r="15" />
      <path d="M175 130c0-17-13-30-30-30" />
    </svg>
  );
}
