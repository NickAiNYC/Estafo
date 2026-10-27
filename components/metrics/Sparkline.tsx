"use client";

interface SparklineProps {
  data: number[];
  color?: "emerald" | "amber" | "crimson" | "steel";
  width?: number;
  height?: number;
}

export default function Sparkline({
  data,
  color = "emerald",
  width = 64,
  height = 20,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padding = 2;
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * drawWidth;
    const y = height - padding - ((val - min) / range) * drawHeight;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  const areaD = `${pathD} L ${width - padding},${height} L ${padding},${height} Z`;

  const colorMap = {
    emerald: { stroke: "#10B981", fill: "rgba(16, 185, 129, 0.12)" },
    amber: { stroke: "#F59E0B", fill: "rgba(245, 158, 11, 0.12)" },
    crimson: { stroke: "#EF4444", fill: "rgba(239, 68, 68, 0.12)" },
    steel: { stroke: "#38BDF8", fill: "rgba(56, 189, 248, 0.12)" },
  };

  const currentTheme = colorMap[color];

  const lastPoint = points[points.length - 1].split(",");
  const lastX = parseFloat(lastPoint[0]);
  const lastY = parseFloat(lastPoint[1]);

  return (
    <svg width={width} height={height} className="overflow-visible select-none shrink-0">
      <defs>
        <linearGradient id={`sparkGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={currentTheme.stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={currentTheme.stroke} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#sparkGrad-${color})`} />
      <path
        d={pathD}
        fill="none"
        stroke={currentTheme.stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="2" fill={currentTheme.stroke} />
    </svg>
  );
}
