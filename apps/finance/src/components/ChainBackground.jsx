// Purely decorative, ambient SVG animation: a faint drifting network of
// nodes and links behind the app, evoking a live blockchain/ledger.
// pointer-events: none so it never interferes with the UI.

const NODES = [
  { x: 6, y: 12 }, { x: 22, y: 28 }, { x: 12, y: 46 }, { x: 30, y: 62 },
  { x: 8, y: 80 }, { x: 40, y: 8 }, { x: 55, y: 22 }, { x: 48, y: 42 },
  { x: 66, y: 55 }, { x: 58, y: 74 }, { x: 78, y: 15 }, { x: 88, y: 34 },
  { x: 82, y: 58 }, { x: 94, y: 76 }, { x: 70, y: 88 }, { x: 36, y: 90 },
]

const LINKS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 6], [6, 7], [7, 3],
  [6, 10], [10, 11], [11, 12], [7, 8], [8, 9], [9, 12], [12, 13],
  [13, 14], [9, 15], [3, 15],
]

export default function ChainBackground() {
  return (
    <svg
      className="chain-bg"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g stroke="var(--border-strong)" strokeWidth="0.15" opacity="0.5">
        {LINKS.map(([a, b], i) => {
          const n1 = NODES[a]
          const n2 = NODES[b]
          return (
            <line
              key={i}
              x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
              className="chain-bg-link"
              style={{ animationDelay: `${(i % 8) * 0.4}s` }}
            />
          )
        })}
      </g>
      {NODES.map((n, i) => (
        <circle
          key={i}
          cx={n.x} cy={n.y} r={i % 3 === 0 ? 0.55 : 0.35}
          className="chain-bg-node"
          fill={i % 5 === 0 ? 'var(--cyan)' : 'var(--mint)'}
          style={{ animationDelay: `${(i % 10) * 0.3}s` }}
        />
      ))}
    </svg>
  )
}
