import React from 'react';
import { cn } from '../lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  delta?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
}

export function StatCard({ 
  label, 
  value, 
  delta, 
  prefix = "", 
  suffix = "", 
  className,
  decimals = 0 
}: StatCardProps) {
  return (
    <div 
      className={cn(
        "relative flex flex-col p-4 bg-bg-surface border border-border-default transition-all duration-200 overflow-hidden group",
        "hover:border-accent hover:shadow-[0_0_20px_rgba(255,70,85,0.15)]",
        className
      )}
    >
      <span className="text-[10px] font-mono uppercase text-text-secondary mb-2 tracking-wider">
        {label}
      </span>
      
      <div className="text-4xl font-mono text-text-primary font-bold">
        {prefix}{value.toFixed(decimals)}{suffix}
      </div>
      
      {delta !== undefined && (
        <div className={cn(
          "text-xs mt-2 font-mono flex items-center",
          delta >= 0 ? "text-success" : "text-accent"
        )}>
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)} <span className="ml-1 text-text-secondary font-body text-[10px] uppercase">vs split ant.</span>
        </div>
      )}
    </div>
  );
}
