export function MizanLogo({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4 22 L16 6 L28 22"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 22 L24 22"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="16" cy="14" r="1.5" fill="currentColor" />
      </svg>
    </div>
  );
}