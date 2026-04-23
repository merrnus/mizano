export function MizanLogo({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Mizan — terazi (denge) */}
        {/* Direk */}
        <path d="M16 6 L16 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {/* Taban */}
        <path d="M11 27 L21 27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {/* Üst tepe noktası */}
        <circle cx="16" cy="6" r="1.4" fill="currentColor" />
        {/* Kol */}
        <path d="M5 11 L27 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {/* Sol askı + kefe */}
        <path d="M6 11 L6 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M3 14 Q6 19 9 14 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
        {/* Sağ askı + kefe */}
        <path d="M26 11 L26 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M23 14 Q26 19 29 14 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );
}