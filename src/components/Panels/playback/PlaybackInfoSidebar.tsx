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
};

function SidebarSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#11161f] p-4">
      <div className="mb-4 flex items-center gap-2 text-white/88">
        {icon}
        <h3 className="text-[13px] font-bold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoGrid({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-white/5 bg-[#0d1219] px-3 py-2">
          <div className="text-[11px] text-white/28">{item.label}</div>
          <div className="mt-1 text-[14px] font-semibold text-white/86">{item.value}</div>
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
}: PlaybackInfoSidebarProps) {
  return (
    <div className="custom-scrollbar z-[10] flex w-[264px] shrink-0 flex-col gap-3 overflow-y-auto border-r border-white/8 bg-[#171a22] p-3">
      <SidebarSection
        icon={<AlertTriangle size={14} className="text-[#18c4ff]" />}
        title="风险回放信息"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[12px] text-white/35">
            <span>风险名称</span>
            <span className="rounded-md border border-[#7b2847] bg-[#3a1524] px-3 py-1 text-[#ff6ca5]">
              {session.event.label}
            </span>
          </div>
          <div className="flex items-center justify-between text-[12px] text-white/35">
            <span>风险类型</span>
            <span className="rounded-md border border-[#0b547f] bg-[#09314b] px-3 py-1 text-[#18c4ff]">
              单船风险
            </span>
          </div>
        </div>
      </SidebarSection>

      <SidebarSection
        icon={<ShipWheel size={14} className="text-[#18c4ff]" />}
        title="船舶信息"
      >
        <div className="mb-3">
          <div className="text-[26px] font-bold tracking-tight text-white">{session.vessel.name}</div>
          <div className="mt-1 text-[12px] tracking-[0.18em] text-white/34">{session.vessel.englishName || session.vessel.name}</div>
        </div>
        <InfoGrid
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
      >
        <InfoGrid
          items={[
            { label: '航向', value: `${session.vessel.heading || '--'}°` },
            { label: '航速', value: `${Number(session.vessel.speed || 0).toFixed(1)} kn` },
          ]}
        />
      </SidebarSection>

      <SidebarSection
        icon={<Cloud size={14} className="text-[#f6c343]" />}
        title="天气信息"
      >
        <InfoGrid
          items={(session.event.weather || []).map((item: { label: string; value: string }) => ({
            label: item.label,
            value: item.value || '-',
          }))}
        />
      </SidebarSection>

      <SidebarSection
        icon={<Map size={14} className="text-[#18c4ff]" />}
        title="关联辖区"
      >
        <PlaybackAreaSelector
          areasByCategory={areasByCategory}
          selectedAreas={selectedAreas}
          expandedCategories={expandedCategories}
          onToggleArea={onToggleArea}
          onToggleCategory={onToggleCategory}
          onToggleAllInCategory={onToggleAllInCategory}
          onReset={onResetAreas}
        />
      </SidebarSection>
    </div>
  );
}
