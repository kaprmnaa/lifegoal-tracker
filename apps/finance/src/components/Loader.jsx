export default function Loader({ label = 'Menyambungkan ke node…' }) {
  return (
    <div className="center-loader">
      <svg width="40" height="40" viewBox="0 0 40 40" className="loader-ring">
        <defs>
          <linearGradient id="loaderGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--mint)" />
            <stop offset="100%" stopColor="var(--cyan)" />
          </linearGradient>
        </defs>
        <circle className="track" cx="20" cy="20" r="16" fill="none" strokeWidth="2.5" />
        <circle
          className="arc"
          cx="20" cy="20" r="16" fill="none" strokeWidth="2.5"
          strokeDasharray="70 100"
        />
      </svg>
      <span>{label}</span>
    </div>
  )
}
