// Shared Recharts props + helpers — keeps every chart consistent with the design tokens.
import type { CSSProperties } from 'react';

export const CHART_COLORS = {
  accent: '#FF4655',
  success: '#00D4AA',
  warning: '#FFB038',
  purple: '#B57EFF',
  muted: '#3A3A45',
  text: '#7A7A8C',
  textStrong: '#F0F0F5',
  grid: 'rgba(255,255,255,0.04)',
  surface: '#111114',
};

export const chartAxisProps = {
  stroke: CHART_COLORS.text,
  fontSize: 11,
  fontFamily: 'JetBrains Mono, monospace',
  tickLine: false,
};

export const chartGridProps = {
  stroke: CHART_COLORS.grid,
  strokeDasharray: '3 3',
};

export const chartTooltipStyle: CSSProperties = {
  background: '#0A0A0C',
  border: `1px solid ${CHART_COLORS.accent}40`,
  borderRadius: 8,
  fontSize: 12,
  fontFamily: 'JetBrains Mono, monospace',
  color: CHART_COLORS.textStrong,
  padding: '8px 12px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
};

export const chartLabelStyle: CSSProperties = {
  color: CHART_COLORS.text,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontSize: 10,
};

export function resultColor(r: string | null | undefined): string {
  if (r === 'W') return CHART_COLORS.success;
  if (r === 'L') return CHART_COLORS.accent;
  return CHART_COLORS.warning;
}
