import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * 统一风险等级样式规范 (浅色模式)
 */
export const RISK_LEVEL_STYLES: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  紧急: {
    border: 'border-red-200',
    bg: 'bg-red-50',
    text: 'text-red-600',
    dot: 'bg-red-500',
  },
  警报: {
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    dot: 'bg-orange-500',
  },
  警告: {
    border: 'border-yellow-200',
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    dot: 'bg-yellow-500',
  },
  注意: {
    border: 'border-sky-200',
    bg: 'bg-sky-50',
    text: 'text-sky-600',
    dot: 'bg-sky-500',
  },
};

/**
 * 通用卡片容器 (浅色模式)
 */
export const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * 通用模块标题 (浅色模式)
 */
export const SectionTitle: React.FC<{ title: string; icon?: React.ReactNode }> = ({ title, icon }) => {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="h-3 w-0.5 rounded-full bg-sky-500" />
      {icon && <span className="text-slate-400">{icon}</span>}
      <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-wider">{title}</h3>
    </div>
  );
};

/**
 * 通用下拉筛选器 (浅色模式)
 */
export const FilterSelect: React.FC<{
  label?: string;
  icon?: React.ReactNode;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className?: string;
}> = ({ label, icon, value, options, onChange, className = '' }) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <span className="text-[9px] uppercase tracking-wider text-slate-400 ml-1">{label}</span>}
      <div className="flex min-w-[82px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-600 transition-all hover:bg-slate-100 focus-within:border-sky-500/50">
        {icon && <span className="shrink-0">{icon}</span>}
        <div className="relative flex-1 min-w-0">
          <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full appearance-none cursor-pointer bg-transparent text-[11px] font-bold text-slate-700 outline-none pr-4"
          >
            {options.map((option) => (
              <option key={option} value={option} className="bg-white text-slate-900">
                {option}
              </option>
            ))}
          </select>
          <ChevronDown size={10} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>
    </div>
  );
};
