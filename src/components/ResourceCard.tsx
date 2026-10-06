import React from 'react';

interface ResourceCardProps {
  title: string;
  value: string | number;
  unit?: string;
  percentage?: number;
  color?: string;
  icon?: React.ReactNode;
}

export default function ResourceCard({ title, value, unit, percentage, color = '#3b82f6', icon }: ResourceCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[#94a3b8] font-medium">{title}</span>
        {icon && <div className="text-[#64748b]">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-3xl font-bold text-white">{typeof value === 'number' ? value.toFixed(1) : value}</span>
        {unit && <span className="text-sm text-[#94a3b8]">{unit}</span>}
      </div>
      {percentage !== undefined && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ 
              width: `${Math.min(100, percentage)}%`, 
              background: `linear-gradient(90deg, ${color}, ${color}dd)` 
            }}
          />
        </div>
      )}
    </div>
  );
}
