import React from 'react';
import { AlertTriangle, Cloud, Compass, Map, ShipWheel } from 'lucide-react';
import type { MockArea, MockAreaMap } from '../../../types';
import type { PlaybackSessionLike } from '../DynamicPlaybackView';
import PlaybackAreaSelector from './PlaybackAreaSelector';

type PlaybackInfoSidebarProps = {
  session: PlaybackSessionLike;
  areasByCategory: MockAreaMap;
  selectedAreas: Set<string>;
  expandedCategories: Set<string>;
  onToggleArea: (areaId: string) => void;
  onToggleCategory: (category: string) => void;
  onToggleAllInCategory: (category: string, areas: MockArea[]) => void;
  onResetAreas: () => void;
  embedded?: boolean;
  showAreaSelector?: boolean;
};

function SidebarSection({
  icon,
  title,
  children,
  embedded = false,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  embedded?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 ${
        embedded ? 'border border-slate-200 bg-white' : 'border border-white/5 bg-[#11161f]'
      }`}
    >
      <div className={`mb-4 flex items-center gap-2 ${embedded ? 'text-slate-800' : 'text-white/88'}`}>
        {icon}
        <h3 className="text-[13px] font-bold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoGrid({
  items,
  embedded = false,
}: {
  items: Array<{ label: string; value: string }>;
  embedded?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-xl px-3 py-2 ${
            embedded ? 'border border-slate-200 bg-slate-50' : 'border border-white/5 bg-[#0d1219]'
          }`}
        >
          <div className={`text-[11px] ${embedded ? 'text-slate-400' : 'text-white/28'}`}>{item.label}</div>
          <div className={`mt-1 text-[14px] font-semibold ${embedded ? 'text-slate-800' : 'text-white/86'}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PlaybackInfoSidebar({
  session,
  areasByCategory,
  selectedAreas,
  expandedCategories,
  onToggleArea,
  onToggleCategory,
  onToggleAllInCategory,
  onResetAreas,
  embedded = false,
  showAreaSelector = true,
}: PlaybackInfoSidebarProps) {
  return (
    <div
      className={`custom-scrollbar z-[10] flex w-[264px] shrink-0 flex-col gap-3 overflow-y-auto p-3 ${
        embedded ? 'border-r border-slate-200 bg-slate-50' : 'border-r border-white/8 bg-[#171a22]'
      }`}
    >
      <SidebarSection
        icon={<AlertTriangle size={14} className="text-[#18c4ff]" />}
        title="风险回放信息"
        embedded={embedded}
      >
        <div className="space-y-3">
          <div className={`flex items-center justify-between text-[12px] ${embedded ? 'text-slate-400' : 'text-white/35'}`}>
            <span>风险名称</span>
            <span
              className={`rounded-md px-3 py-1 ${
                embedded
                  ? 'border border-rose-200 bg-rose-50 text-rose-500'
                  : 'border border-[#7b2847] bg-[#3a1524] text-[#ff6ca5]'
              }`}
            >
              {session.event.label}
            </span>
          </div>
          <div className={`flex items-center justify-between text-[12px] ${embedded ? 'text-slate-400' : 'text-white/35'}`}>
            <span>风险类型</span>
            <span
              className={`rounded-md px-3 py-1 ${
                embedded
                  ? 'border border-sky-200 bg-sky-50 text-sky-600'
                  : 'border border-[#0b547f] bg-[#09314b] text-[#18c4ff]'
              }`}
            >
              单船风险
            </span>
          </div>
        </div>
      </SidebarSection>

      <SidebarSection
        icon={<ShipWheel size={14} className="text-[#18c4ff]" />}
        title="船舶信息"
        embedded={embedded}
      >
        <div className="mb-3">
          <div className={`text-[26px] font-bold tracking-tight ${embedded ? 'text-slate-900' : 'text-white'}`}>
            {session.vessel.name}
          </div>
          <div className={`mt-1 text-[12px] tracking-[0.18em] ${embedded ? 'text-slate-400' : 'text-white/34'}`}>
            {session.vessel.englishName || session.vessel.name}
          </div>
        </div>
        <InfoGrid
          embedded={embedded}
          items={[
            { label: '长宽', value: `${session.vessel.length}m x ${session.vessel.width}m` },
            { label: '吃水', value: session.vessel.draft ? `${session.vessel.draft}m` : '-' },
            { label: '类型', value: session.vessel.type || '-' },
            { label: '货物', value: session.vessel.cargo || '-' },
          ]}
        />
      </SidebarSection>

      <SidebarSection
        icon={<Compass size={14} className="text-[#1ee6a0]" />}
        title="动态信息"
        embedded={embedded}
      >
        <InfoGrid
          embedded={embedded}
          items={[
            { label: '航向', value: `${session.vessel.heading || '--'}°` },
            { label: '航速', value: `${Number(session.vessel.speed || 0).toFixed(1)} kn` },
          ]}
        />
      </SidebarSection>

      <SidebarSection
        icon={<Cloud size={14} className="text-[#f6c343]" />}
        title="天气信息"
        embedded={embedded}
      >
        <InfoGrid
          embedded={embedded}
          items={(session.event.weather || []).map((item: { label: string; value: string }) => ({
            label: item.label,
            value: item.value || '-',
          }))}
        />
      </SidebarSection>

      {showAreaSelector ? (
        <SidebarSection
          icon={<Map size={14} className="text-[#18c4ff]" />}
          title="关联辖区"
          embedded={embedded}
        >
          <PlaybackAreaSelector
            areasByCategory={areasByCategory}
            selectedAreas={selectedAreas}
            expandedCategories={expandedCategories}
            onToggleArea={onToggleArea}
            onToggleCategory={onToggleCategory}
            onToggleAllInCategory={onToggleAllInCategory}
            onReset={onResetAreas}
            embedded={embedded}
          />
        </SidebarSection>
      ) : null}
    </div>
  );
}
