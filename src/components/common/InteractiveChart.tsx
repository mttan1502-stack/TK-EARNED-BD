import React, { useState } from 'react';

interface ChartPoint {
  date: string;
  earnings: number;
  withdrawals: number;
}

interface InteractiveChartProps {
  data: ChartPoint[];
  currencySymbol?: string;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({ data, currencySymbol = '৳' }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-500 text-sm">No chart data available</div>;
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.earnings, d.withdrawals)), 100);
  const chartHeight = 220;
  const chartWidth = 600;
  const paddingX = 40;
  const paddingY = 25;

  const getX = (idx: number) => paddingX + (idx / (data.length - 1)) * (chartWidth - paddingX * 2);
  const getY = (val: number) => chartHeight - paddingY - (val / (maxVal * 1.15)) * (chartHeight - paddingY * 2);

  // Generate SVG path points
  const earningsPoints = data.map((d, i) => `${getX(i)},${getY(d.earnings)}`).join(' ');
  const withdrawalsPoints = data.map((d, i) => `${getX(i)},${getY(d.withdrawals)}`).join(' ');

  const earningsArea = `${getX(0)},${chartHeight - paddingY} ${earningsPoints} ${getX(data.length - 1)},${chartHeight - paddingY}`;
  const withdrawalsArea = `${getX(0)},${chartHeight - paddingY} ${withdrawalsPoints} ${getX(data.length - 1)},${chartHeight - paddingY}`;

  return (
    <div className="relative w-full overflow-hidden select-none">
      {/* Legend & Stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-5 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-purple-500" />
            <span className="text-slate-300">Platform Rewards Paid</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-amber-400" />
            <span className="text-slate-300">Withdrawals Settled</span>
          </div>
        </div>

        {hoverIndex !== null && data[hoverIndex] && (
          <div className="text-xs font-mono tabular-nums text-slate-200 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-md">
            {data[hoverIndex].date}: Rewards{' '}
            <span className="text-purple-400 font-semibold">{currencySymbol}{data[hoverIndex].earnings}</span> · Paid{' '}
            <span className="text-amber-400 font-semibold">{currencySymbol}{data[hoverIndex].withdrawals}</span>
          </div>
        )}
      </div>

      {/* SVG Viewport */}
      <div className="w-full">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((pct, idx) => {
            const y = chartHeight - paddingY - pct * (chartHeight - paddingY * 2);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-800/60 stroke-[1]"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-500 font-mono"
                >
                  {Math.round(pct * maxVal)}
                </text>
              </g>
            );
          })}

          {/* Shaded Areas */}
          <polygon points={earningsArea} fill="url(#purpleGrad)" />
          <polygon points={withdrawalsArea} fill="url(#amberGrad)" />

          {/* Lines */}
          <polyline
            points={earningsPoints}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={withdrawalsPoints}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover interactive markers */}
          {data.map((d, i) => {
            const x = getX(i);
            const isHovered = hoverIndex === i;
            return (
              <g key={i} className="cursor-pointer" onMouseEnter={() => setHoverIndex(i)}>
                {/* Invisible hover capture column */}
                <rect
                  x={x - 20}
                  y={0}
                  width={40}
                  height={chartHeight}
                  fill="transparent"
                />
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={chartHeight - paddingY}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}
                {/* Data point circle */}
                <circle
                  cx={x}
                  cy={getY(d.earnings)}
                  r={isHovered ? 5 : 3.5}
                  className="fill-purple-400 stroke-slate-950 stroke-2 transition-all"
                />
                <circle
                  cx={x}
                  cy={getY(d.withdrawals)}
                  r={isHovered ? 5 : 3}
                  className="fill-amber-400 stroke-slate-950 stroke-2 transition-all"
                />
                {/* X-axis date labels */}
                <text
                  x={x}
                  y={chartHeight - 6}
                  textAnchor="middle"
                  className={`text-[10px] font-mono transition-colors ${
                    isHovered ? 'fill-white font-semibold' : 'fill-slate-400'
                  }`}
                >
                  {d.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
