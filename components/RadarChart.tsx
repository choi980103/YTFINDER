"use client";

interface RadarChartProps {
  /** 각 축: { label, value(0~100) } */
  axes: { label: string; value: number }[];
  size?: number;
  color?: string;
}

export default function RadarChart({
  axes,
  size = 240,
  color = "#00e5a0",
}: RadarChartProps) {
  const padding = 30;
  const full = size + padding * 2;
  const cx = full / 2;
  const cy = full / 2;
  const r = size * 0.38; // 반지름
  const levels = 4; // 동심원 레벨
  const n = axes.length;
  const angleStep = (Math.PI * 2) / n;

  // 각도 → 좌표 (12시 방향 시작)
  const toXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
  });

  // 동심원 경로
  const gridPaths = Array.from({ length: levels }, (_, i) => {
    const lr = (r * (i + 1)) / levels;
    return axes
      .map((_, j) => {
        const { x, y } = toXY(j * angleStep, lr);
        return `${j === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ") + " Z";
  });

  // 데이터 영역 경로
  const dataPath =
    axes
      .map((a, i) => {
        const val = Math.max(0, Math.min(100, a.value));
        const { x, y } = toXY(i * angleStep, (val / 100) * r);
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ") + " Z";

  // 데이터 점
  const dataPoints = axes.map((a, i) => {
    const val = Math.max(0, Math.min(100, a.value));
    return toXY(i * angleStep, (val / 100) * r);
  });

  return (
    <svg
      viewBox={`0 0 ${full} ${full}`}
      className="w-full max-w-[280px] mx-auto"
    >
      {/* 동심원 */}
      {gridPaths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}

      {/* 축 선 */}
      {axes.map((_, i) => {
        const { x, y } = toXY(i * angleStep, r);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        );
      })}

      {/* 데이터 영역 */}
      <path d={dataPath} fill={`${color}20`} stroke={color} strokeWidth={2} />

      {/* 데이터 점 */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color} />
      ))}

      {/* 라벨 */}
      {axes.map((a, i) => {
        const labelR = r + 22;
        const { x, y } = toXY(i * angleStep, labelR);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-zinc-400 text-[10px]"
          >
            {a.label}
          </text>
        );
      })}

      {/* 값 표시 */}
      {axes.map((a, i) => {
        const val = Math.max(0, Math.min(100, a.value));
        const { x, y } = toXY(i * angleStep, (val / 100) * r);
        return (
          <text
            key={`v-${i}`}
            x={x}
            y={y - 10}
            textAnchor="middle"
            className="fill-zinc-300 text-[9px] font-bold"
          >
            {Math.round(a.value)}
          </text>
        );
      })}
    </svg>
  );
}
