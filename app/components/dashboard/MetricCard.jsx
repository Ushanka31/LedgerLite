'use client';

import { useState } from 'react';

// Simple sparkline component
function Sparkline({ data = [], color = '#10b981' }) {
  if (!data.length) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 60;
    const y = 20 - ((value - min) / range) * 20;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg className="sparkline" viewBox="0 0 60 20">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
        opacity="0.8"
      />
    </svg>
  );
}

export default function MetricCard({ 
  title, 
  value, 
  icon, 
  color = 'blue', 
  trend = null,
  sparklineData = [],
  cta = null,
  onCtaClick = null,
  onClick = null,
  isClickable = false
}) {
  const isZero = value === 0 || value === '₦0.00' || value === '$0.00';
  
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
  };
  
  const sparklineColors = {
    blue: '#3b82f6',
    green: '#10b981',
    red: '#ef4444',
    purple: '#8b5cf6',
    orange: '#f59e0b',
  };

  const cardClasses = `metric-card p-6 group transition-all duration-200 ${
    isClickable 
      ? 'cursor-pointer hover:scale-105 hover:shadow-lg' 
      : onClick 
        ? 'cursor-pointer' 
        : ''
  }`;

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            {isClickable && !isZero && (
              <p className="text-xs text-slate-400 mt-1">Click for details</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-xs ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.direction === 'up' ? '↗' : '↘'} {trend.percentage}%
                </span>
              </div>
            )}
          </div>
        </div>
        
        {sparklineData.length > 0 && (
          <div className="opacity-70 group-hover:opacity-100 transition-opacity">
            <Sparkline data={sparklineData} color={sparklineColors[color]} />
          </div>
        )}
      </div>
      
      <div>
        {isZero && cta ? (
          <div className="space-y-2">
            <p className="text-2xl font-bold text-slate-400">—</p>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click
                onCtaClick?.();
              }}
              className="text-sm text-slate-500 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors w-full text-left hover:text-slate-700"
            >
              {cta}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            {cta && !isZero && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  if (isClickable && onClick) {
                    onClick(); // For clickable cards, the CTA should trigger the main action
                  } else {
                    onCtaClick?.();
                  }
                }}
                className="text-xs text-slate-400 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors w-full text-left hover:text-slate-600"
              >
                {cta}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 