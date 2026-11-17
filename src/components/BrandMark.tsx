/** Five level bars: the product mark (same as the favicon). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d="M9 20v-8M13 23V9M17 19v-6M21 22V10M25 18v-4" className="stroke-accent" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
