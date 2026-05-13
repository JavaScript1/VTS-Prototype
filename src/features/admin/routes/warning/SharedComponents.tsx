import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * 统一风险等级样式规范
 */
export const RISK_LEVEL_STYLES: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  紧急: {
    border: 'border-[#7f1d1d]',
    bg: 'bg-[#3b1114]',
    text: 'text-[#ff7b9c]',
    dot: 'bg-[#ff4f86]',
  },
  警报: {
    border: 'border-[#6b2d1a]',
    bg: 'bg-[#3c1d15]',
    text: 'text-[#ff7a4d]',
    dot: 'bg-[#ff7a4d]',
  },
  警告: {
    border: 'border-[#5e4b19]',
    bg: 'bg-[#3b3114]',
    text: 'text-[#f6c343]',
    dot: 'bg-[#f6c343]',
  },
  注意: {
    border: 'border-[#124a6c]',
    bg: 'bg-[#0d2d42]',
    text: 'text-[#4cc6ff]',
    dot: 'bg-[#4cc6ff]',
  },
};

/**
 * 通用卡片容器
 */
export const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-[#15304b] bg-[radial-gradient(circle_at_top,_rgba(20,44,74,0.32),_rgba(10,15,24,0.96)_58%)] shadow-lg ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * 通用模块标题
 */
export const SectionTitle: React.FC<{ title: string; icon?: React.ReactNode }> = ({ title, icon }) => {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="h-3 w-0.5 rounded-full bg-[#18c4ff]" />
      {icon && <span className="text-white/60">{icon}</span>}
      <h3 className="text-[12px] font-black text-white/90 uppercase tracking-wider">{title}</h3>
    </div>
  );
};

/**
 * 通用下拉筛选器
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
      {label && <span className="text-[9px] uppercase tracking-wider text-white/30 ml-1">{label}</span>}
      <div className="flex min-w-[82px] items-center gap-2 rounded-xl border border-white/8 bg-[#111823] px-2.5 py-1.5 text-[11px] text-white/72 transition-all hover:bg-[#1a222d] focus-within:border-[#18c4ff]/50">
        {icon && <span className="shrink-0">{icon}</span>}
        <div className="relative flex-1 min-w-0">
          <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full appearance-none cursor-pointer bg-transparent text-[11px] font-bold text-white/80 outline-none pr-4"
          >
            {options.map((option) => (
              <option key={option} value={option} className="bg-[#101722] text-white">
                {option}
              </option>
            ))}
          </select>
          <ChevronDown size={10} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-white/40" />
        </div>
      </div>
    </div>
  );
};
