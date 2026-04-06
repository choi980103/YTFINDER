"use client";

import { useMemo } from "react";

interface DataPoint {
  label: string;
  value: number;
}

interface DetailChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  title: string;
  subtitle?: string;
  valueFormatter?: (v: number) => string;
}

function defaultFormatter(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v.toFixed(0);
}

export default function DetailChart({
  data,
  color = "#00e5a0",
  height = 200,
  title,
  subtitle,
  valueFormatter = defaultFormatter,
}: DetailChartProps) {
  const chartData = useMemo(() => {
    if (data.length < 2) return null;

    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const padding = { top: 20, bottom: 30, left: 0, right: 0 };
    const chartW = 100; // percentage-based
    const chartH = height - padding.top - padding.bottom;

    const points = data.map((d, i) => ({
      x: (i / (data.length - 1)) * 100,
      y: padding.top + chartH - ((d.value - min) / range) * chartH,
      ...d,
    }));

    const pathD = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

    return { points, pathD, areaD, min, max, padding };
  }, [data, height]);

  if (!chartData || data.length < 2) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-zinc-300">{title}</h3>
        <p className="mt-2 text-xs text-zinc-600">데이터가 충분하지 않습니다 (최소 2개 필요)</p>
      </div>
    );
  }

  const { points, pathD, areaD, min, max, padding } = chartData;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-300">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[10px] text-zinc-600">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
          <span>최저 {valueFormatter(min)}</span>
          <span>최고 {valueFormatter(max)}</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 100 ${height}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ height }}
      >
        <defs>
          <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((ratio) => {
          const y = padding.top + (height - padding.top - padding.bottom) * (1 - ratio);
          return (
            <line
              key={ratio}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="0.3"
            />
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill={`url(#grad-${title})`} />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1.2"
            fill={color}
            className="transition-all"
          >
            <title>{`${p.label}: ${valueFormatter(p.value)}`}</title>
          </circle>
        ))}
      </svg>

      {/* X-axis labels */}
      <div className="mt-1 flex justify-between text-[9px] text-zinc-600">
        {data.length <= 8
          ? data.map((d, i) => <span key={i}>{d.label}</span>)
          : [data[0], data[Math.floor(data.length / 2)], data[data.length - 1]].map(
              (d, i) => <span key={i}>{d.label}</span>
            )}
      </div>
    </div>
  );
}
