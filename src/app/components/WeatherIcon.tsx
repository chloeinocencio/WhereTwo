interface Props { code: number; size?: number; }

function group(code: number) {
  if (code === 0) return 'sunny';
  if (code <= 2) return 'partlyCloudy';
  if (code === 3) return 'overcast';
  if (code <= 48) return 'fog';
  if (code <= 57) return 'drizzle';
  if (code <= 67 || (code >= 80 && code <= 82)) return 'rain';
  if (code <= 77 || code === 85 || code === 86) return 'snow';
  return 'thunderstorm';
}

const icons: Record<string, JSX.Element> = {
  sunny: (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.5" fill="#F59E0B" />
      {[0,45,90,135,180,225,270,315].map((deg) => {
        const r = (deg * Math.PI) / 180;
        return (
          <line key={deg}
            x1={12 + 7 * Math.cos(r)} y1={12 + 7 * Math.sin(r)}
            x2={12 + 9.5 * Math.cos(r)} y2={12 + 9.5 * Math.sin(r)}
            stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"
          />
        );
      })}
    </svg>
  ),

  partlyCloudy: (
    <svg viewBox="0 0 24 24" fill="none">
      {/* Small sun top-right */}
      <circle cx="17" cy="8" r="3" fill="#F59E0B" />
      <line x1="17" y1="3" x2="17" y2="2" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="8" x2="23" y2="8" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20.1" y1="4.9" x2="21.2" y2="3.8" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      {/* Cloud in front */}
      <path d="M5 18h11a3.5 3.5 0 0 0 .5-7 5.5 5.5 0 0 0-10.4 1.5A3.5 3.5 0 0 0 5 18z"
        fill="#94A3B8" />
    </svg>
  ),

  overcast: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 14.5A4.5 4.5 0 0 1 8.5 10a6 6 0 0 1 11.5 3 3.5 3.5 0 0 1 0 7H8A4 4 0 0 1 4 14.5z"
        fill="#94A3B8" />
    </svg>
  ),

  fog: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 11.5A4.5 4.5 0 0 1 8.5 7a6 6 0 0 1 11.5 3 3.5 3.5 0 0 1 0 7H8A4 4 0 0 1 4 11.5z"
        fill="#CBD5E1" />
      <line x1="4" y1="19" x2="20" y2="19" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <line x1="7" y1="22" x2="17" y2="22" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  drizzle: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 12.5A4.5 4.5 0 0 1 8.5 8a6 6 0 0 1 11.5 3 3.5 3.5 0 0 1 0 7H8A4 4 0 0 1 4 12.5z"
        fill="#94A3B8" />
      <circle cx="10" cy="21" r="1.2" fill="#93C5FD" />
      <circle cx="14" cy="21" r="1.2" fill="#93C5FD" />
      <circle cx="12" cy="24" r="1.2" fill="#93C5FD" />
    </svg>
  ),

  rain: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 12.5A4.5 4.5 0 0 1 8.5 8a6 6 0 0 1 11.5 3 3.5 3.5 0 0 1 0 7H8A4 4 0 0 1 4 12.5z"
        fill="#64748B" />
      <line x1="9" y1="20" x2="7" y2="24" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
      <line x1="13" y1="20" x2="11" y2="24" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
      <line x1="17" y1="20" x2="15" y2="24" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),

  snow: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 12.5A4.5 4.5 0 0 1 8.5 8a6 6 0 0 1 11.5 3 3.5 3.5 0 0 1 0 7H8A4 4 0 0 1 4 12.5z"
        fill="#94A3B8" />
      <circle cx="9.5" cy="21.5" r="1.5" fill="#BAE6FD" />
      <circle cx="14.5" cy="21.5" r="1.5" fill="#BAE6FD" />
      <circle cx="12" cy="24.5" r="1.5" fill="#BAE6FD" />
    </svg>
  ),

  thunderstorm: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 12.5A4.5 4.5 0 0 1 8.5 8a6 6 0 0 1 11.5 3 3.5 3.5 0 0 1 0 7H8A4 4 0 0 1 4 12.5z"
        fill="#475569" />
      {/* Lightning bolt */}
      <polyline points="14,13 10,19 15,19 11,25"
        stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
};

export function WeatherIcon({ code, size = 20 }: Props) {
  const icon = icons[group(code)] ?? icons.overcast;
  return (
    <span style={{ display: 'inline-flex', width: size, height: size, flexShrink: 0 }}>
      {icon}
    </span>
  );
}
