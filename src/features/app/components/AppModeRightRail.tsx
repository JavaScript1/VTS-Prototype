import type { ReactNode } from 'react';
import { Activity, AlertTriangle, LifeBuoy, PlayCircle, Waves } from 'lucide-react';
import { MOCK_ALERTS, MOCK_RISK_STATS } from '../../../mockData';
import type { HomeShipDetail } from '../../../types';
import type { HomeViewMode } from '../utils/viewModes';
import MessagePushPanel from './MessagePushPanel';
import RiskAnalysisDashboard from './RiskAnalysisDashboard';
import type { MessageFeedItem } from './messagePushConfig';

type AppModeRightRailProps = {
  mode: Exclude<HomeViewMode, 'normal'>;
  currentTime: Date;
  selectedHomeShip: HomeShipDetail | null;
  onOpenPlayback: (index: number) => void;
  onSmartDutyMessagesChange?: (messages: MessageFeedItem[]) => void;
};

function PanelShell({
  title,
  subtitle,
  hideHeader = false,
  children,
}: {
  title: string;
  subtitle: string;
  hideHeader?: boolean;
  children: ReactNode;
}) {
  return (
    <aside className="flex h-full w-[420px] shrink-0 flex-col border-l border-white/10 bg-[#060606]/92 p-4 backdrop-blur-xl transition-all duration-500 group-[.vts-theme--light]/shell:bg-slate-50 group-[.vts-theme--light]/shell:border-slate-200">
      {!hideHeader ? (
        <div className="mb-4 border-b border-white/8 pb-4 group-[.vts-theme--light]/shell:border-slate-200">
          <div className="text-[13px] font-black uppercase tracking-[0.2em] text-white/85 group-[.vts-theme--light]/shell:text-slate-900">
            {title}
          </div>
          <div className="mt-2 text-xs leading-5 text-white/45 group-[.vts-theme--light]/shell:text-slate-400">{subtitle}</div>
        </div>
      ) : null}
      <div className="min-h-0 flex-1">{children}</div>
    </aside>
  );
}

function SmartDutyRail({
  currentTime,
  onMessagesChange,
}: {
  currentTime: Date;
  onMessagesChange?: (messages: MessageFeedItem[]) => void;
}) {
  return (
    <PanelShell
      title="智能值班"
      subtitle={`当前值班时段 ${currentTime.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })}，右侧集中承载消息推送与值班摘要。`}
      hideHeader
    >
      <MessagePushPanel
        variant="embedded"
        title="消息推送"
        maxMessages={8}
        className="h-full"
        onMessagesChange={onMessagesChange}
      />
    </PanelShell>
  );
}

function RiskAnalysisRail() {
  return null;
}

function CasePlaybackRail({
  selectedHomeShip,
  onOpenPlayback,
}: {
  selectedHomeShip: HomeShipDetail | null;
  onOpenPlayback: (index: number) => void;
}) {
  return (
    <PanelShell
      title="案情回放"
      subtitle="保留地图主页视角，同时在右侧列出可直接进入的典型案情回放样本。"
    >
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 text-white/80">
          <Activity size={16} className="text-sky-300" />
          <span className="text-sm font-bold">当前关注船舶</span>
        </div>
        <div className="mt-3 text-lg font-black text-white">
          {selectedHomeShip?.name ?? '未选择船舶'}
        </div>
        <div className="mt-1 text-xs text-white/45">
          {selectedHomeShip?.riskSummary ?? '点击地图船舶后可联动案情回放入口。'}
        </div>
      </div>

      <div className="custom-scrollbar h-[calc(100%-124px)] space-y-3 overflow-y-auto pr-1">
        {MOCK_RISK_STATS.slice(0, 4).map((item, index) => (
          <div key={`${item.name}-${item.time}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-white">{item.name}</div>
                <div className="mt-1 text-xs text-white/45">{item.time}</div>
              </div>
              <div className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] text-white/55">
                {item.type}
              </div>
            </div>
            <div className="mt-3 text-xs leading-5 text-white/70">{item.snapshot.location}</div>
            <button
              onClick={() => onOpenPlayback(index)}
              className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10"
            >
              <PlayCircle size={14} />
              进入案情回放
            </button>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function EmergencyRescueRail({ onOpenPlayback }: { onOpenPlayback: (index: number) => void }) {
  const rescueAlerts = MOCK_ALERTS.filter(
    (item) => item.level === 'emergency' || item.level === 'warning',
  ).slice(0, 4);

  return (
    <PanelShell
      title="紧急救援"
      subtitle="以应急联动为主，整合重点告警、处置建议与快捷回放入口。"
    >
      <div className="mb-4 grid grid-cols-2 gap-3">
        {[
          { label: '待出警事件', value: rescueAlerts.length, icon: LifeBuoy },
          { label: '联动单位', value: 4, icon: Waves },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
            <div className="flex items-center justify-between text-red-200/80">
              <span className="text-[11px]">{item.label}</span>
              <item.icon size={14} />
            </div>
            <div className="mt-3 text-2xl font-black text-white">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="custom-scrollbar h-[calc(100%-200px)] space-y-3 overflow-y-auto pr-1">
        {rescueAlerts.map((item, index) => (
          <div key={item.id} className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4">
            <div className="flex items-center gap-2 text-red-200">
              <AlertTriangle size={16} />
              <span className="text-sm font-bold">{item.type}</span>
            </div>
            <div className="mt-3 text-sm font-semibold text-white">{item.ship}</div>
            <div className="mt-1 text-xs leading-5 text-white/70">{item.summary}</div>
            <button
              onClick={() => onOpenPlayback(index)}
              className="mt-4 flex items-center gap-2 rounded-lg border border-red-400/20 bg-white/5 px-3 py-2 text-xs font-semibold text-red-200 transition-colors hover:bg-white/10"
            >
              <PlayCircle size={14} />
              查看应急回放
            </button>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

export default function AppModeRightRail({
  mode,
  currentTime,
  selectedHomeShip,
  onOpenPlayback,
  onSmartDutyMessagesChange,
}: AppModeRightRailProps) {
  if (mode === 'smart-duty') {
    return <SmartDutyRail currentTime={currentTime} onMessagesChange={onSmartDutyMessagesChange} />;
  }

  if (mode === 'risk-analysis') {
    return <RiskAnalysisRail />;
  }

  if (mode === 'case-playback') {
    return (
      <CasePlaybackRail
        selectedHomeShip={selectedHomeShip}
        onOpenPlayback={onOpenPlayback}
      />
    );
  }

  return <EmergencyRescueRail onOpenPlayback={onOpenPlayback} />;
}
