export default function Logo({ width = 120, height = 38 }: { width?: number; height?: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 320 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Born 2 Win"
    >
      <text
        x="50%"
        y="76"
        textAnchor="middle"
        fontFamily="var(--font-dancing), 'Brush Script MT', cursive"
        fontSize="68"
        fontWeight="700"
        fill="#45D4E8"
      >
        Born 2 Win
      </text>
    </svg>
  );
}
