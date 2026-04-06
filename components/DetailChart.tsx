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
  height = 220,
  title,
  subtitle,
  valueFormatter = defaultFormatter,
}: DetailChartProps) {
  const chartData = useMemo(() => {
    if (data.length < 2) return null;

    const values = data.map((d) => d.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const range = rawMax - rawMin || 1;

    // Y축 여유 (10%)
    const min = rawMin - range * 0.1;
    const max = rawMax + range * 0.1;
    const yRange = max - min;

    const W = 600;
    const H = height;
    const pad = { top: 24, bottom: 40, left: 60, right: 20 };
    const cw = W - pad.left - pad.right;
    const ch = H - pad.top - pad.bottom;

    const points = data.map((d, i) => ({
      x: pad.left + (i / (data.length - 1)) * cw,
      y: pad.top + ch - ((d.value - min) / yRange) * ch,
      ...d,
    }));

    // 부드러운 곡선 경로
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      pathD += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${pad.top + ch} L ${points[0].x} ${pad.top + ch} Z`;

    // Y축 눈금 (5단계)
    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const ratio = i / 4;
      const val = rawMin + (rawMax - rawMin) * ratio;
      const y = pad.top + ch - ((val - min) / yRange) * ch;
      return { y, val };
    });

    return { points, pathD, areaD, rawMin, rawMax, yTicks, W, H, pad, ch };
  }, [data, height]);

  if (!chartData || data.length < 2) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-zinc-300">{title}</h3>
        <p className="mt-2 text-xs text-zinc-600">데이터가 충분하지 않습니다 (최소 2개 필요)</p>
      </div>
    );
  }

  const { points, pathD, areaD, rawMin, rawMax, yTicks, W, H, pad, ch } = chartData;
  const gradId = `grad-${title.replace(/\s/g, "")}`;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-300">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[10px] text-zinc-600">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-zinc-500">최저 <span className="font-semibold text-zinc-300">{valueFormatter(rawMin)}</span></span>
          <span className="text-zinc-500">최고 <span className="font-semibold text-zinc-300">{valueFormatter(rawMax)}</span></span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y축 눈금선 + 라벨 */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={pad.left}
              y1={t.y}
              x2={W - pad.right}
              y2={t.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
              strokeDasharray={i === 0 ? "none" : "4 4"}
            />
            <text
              x={pad.left - 8}
              y={t.y + 4}
              textAnchor="end"
              className="fill-zinc-500"
              fontSize={11}
            >
              {valueFormatter(t.val)}
            </text>
          </g>
        ))}

        {/* 영역 채우기 */}
        <path d={areaD} fill={`url(#${gradId})`} />

        {/* 곡선 */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 데이터 포인트 + 값 표시 */}
        {points.map((p, i) => (
          <g key={i}>
            {/* 외곽 원 */}
            <circle cx={p.x} cy={p.y} r={5} fill={color} opacity={0.2} />
            {/* 내부 원 */}
            <circle cx={p.x} cy={p.y} r={3} fill={color} />
            {/* 값 라벨 (포인트 위에) */}
            <text
              x={p.x}
              y={p.y - 12}
              textAnchor="middle"
              className="fill-zinc-300"
              fontSize={10}
              fontWeight={600}
            >
              {valueFormatter(p.value)}
            </text>
          </g>
        ))}

        {/* X축 라벨 */}
        {(() => {
          // 라벨이 너무 많으면 간격 조절
          const step = data.length <= 6 ? 1 : data.length <= 12 ? 2 : 3;
          return points
            .filter((_, i) => i % step === 0 || i === points.length - 1)
            .map((p, i) => (
              <text
                key={i}
                x={p.x}
                y={H - 8}
                textAnchor="middle"
                className="fill-zinc-500"
                fontSize={10}
              >
                {p.label}
              </text>
            ));
        })()}
      </svg>
    </div>
  );
}
