import { cn } from "@/lib/utils"

interface CollegeQuoraLogoProps {
  className?: string
}

export function CollegeQuoraLogo({ className }: CollegeQuoraLogoProps) {
  return (
    <div className={cn("relative", className)}>
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        <rect x="2" y="2" width="28" height="28" rx="6" fill="url(#logoGradient)" className="drop-shadow-lg" />

        <path d="M8 12 L16 8 L24 12 L24 20 L16 24 L8 20 Z" fill="white" fillOpacity="0.9" />

        <circle cx="12" cy="14" r="2" fill="url(#logoGradient)" />

        <circle cx="20" cy="14" r="2" fill="url(#logoGradient)" />

        <path d="M14 18 Q16 20 18 18" stroke="url(#logoGradient)" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        <path d="M10 10 L22 10" stroke="url(#logoGradient)" strokeWidth="1" strokeLinecap="round" />

        <path d="M12 22 L20 22" stroke="url(#logoGradient)" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </div>
  )
}
