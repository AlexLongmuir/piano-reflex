export function LogoGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden>
      <rect x="1.5" y="4.5" width="25" height="19" rx="3.5" stroke="currentColor" strokeOpacity="0.5" />
      <line x1="8.4" y1="5" x2="8.4" y2="23.5" stroke="currentColor" strokeOpacity="0.5" strokeWidth="0.9" />
      <line x1="14.5" y1="5" x2="14.5" y2="23.5" stroke="currentColor" strokeOpacity="0.5" strokeWidth="0.9" />
      <line x1="20.6" y1="5" x2="20.6" y2="23.5" stroke="currentColor" strokeOpacity="0.5" strokeWidth="0.9" />
      <rect x="6.4" y="4.8" width="4" height="11" rx="1" fill="currentColor" />
      <rect x="18.6" y="4.8" width="4" height="11" rx="1" fill="currentColor" fillOpacity="0.55" />
    </svg>
  );
}
