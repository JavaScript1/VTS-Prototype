import {
  Activity,
  Clock,
  FileText,
  History,
  MapPin,
  MessageSquare,
  Radio,
  Ship,
} from 'lucide-react';
import type { HomeShipDetail } from '../../types';

type HomeShipDetailPanelProps = {
  ship: HomeShipDetail | null;
  onSelectTrackPoint: (trackPointId: string | null) => void;
};

const getStatusClassName = (status: HomeShipDetail['status']) => {
  if (status === 'warning') return 'bg-red-500/10 text-red-400 border border-red-500/20';
  if (status === 'caution') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
};

const getStatusLabel = (status: HomeShipDetail['status']) => {
  if (status === 'warning') return '风险关注';
  if (status === 'caution') return '持续跟踪';
  return '动态正常';
};

export default function HomeShipDetailPanel({
  ship,
  onSelectTrackPoint,
}: HomeShipDetailPanelProps) {
  if (!ship) return null;

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a]">
      <div className="border-b border-white/10 bg-[#0d1117] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[17px] font-black leading-tight text-white">
                {ship.name}
              </h2>
              {ship.displayName.split(' / ')[0] && (
                <span className="truncate text-[10px] font-bold uppercase text-white/30">
                  {ship.displayName.split(' / ')[0]}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`rounded px-1.5 py-1 text-[10px] font-black uppercase tracking-widest ${getStatusClassName(ship.status)}`}>
                {getStatusLabel(ship.status)}
              </span>
              <span className="text-[10px] font-mono text-white/40">MMSI: {ship.mmsi}</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 px-1.5 py-1 text-[10px] font-black uppercase tracking-widest text-sky-400">
              <div className="h-1 w-1 animate-pulse rounded-full bg-sky-400" />
              Tracking
            </div>
            <button
              onClick={() => onSelectTrackPoint(ship.track[ship.track.length - 1]?.id ?? null)}
              className="text-[10px] font-bold text-white/50 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white"
            >
              定位当前位置
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-1.5 rounded-lg bg-sky-500 py-2 text-[10px] font-black text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-400 active:scale-95">
            <Radio size={12} /> 进入 VHF 会话
          </button>
          <button className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-[10px] font-black text-white/70 transition-all hover:bg-white/10 active:scale-95">
            <History size={12} /> 轨迹完整回放
          </button>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto space-y-4 p-3">
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20">
            <Activity size={12} className="text-sky-400" />
            实时动态与状态
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 shadow-inner">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-white/20">实时航速</div>
                <div className="font-mono text-[14px] font-black text-white">
                  {ship.speed.toFixed(1)} <span className="text-[10px] text-white/30">kn</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-white/20">实时航向</div>
                <div className="font-mono text-[14px] font-black text-white">{ship.heading}°</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-white/20">吃水高度</div>
                <div className="font-mono text-[14px] font-black text-orange-400">{ship.draft}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-[10px] uppercase tracking-widest text-white/20">当前位置 / 航段</div>
                <div className="truncate text-[10px] font-bold text-sky-400">{ship.route.current}</div>
              </div>
              <div className="pl-4 text-right">
                <div className="mb-1 text-[10px] uppercase tracking-widest text-white/20">目的地</div>
                <div className="truncate text-[10px] font-bold text-white/80">{ship.destination}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20">
            <Ship size={12} className="text-sky-400" />
            船舶技术参数 (静态)
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 shadow-inner">
            <div className="grid grid-cols-3 gap-x-2 gap-y-3">
              <div className="space-y-0.5">
                <div className="text-[8px] uppercase tracking-widest text-white/20">呼号</div>
                <div className="font-mono text-[10px] font-bold text-sky-300">{ship.callsign}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[8px] uppercase tracking-widest text-white/20">IMO</div>
                <div className="font-mono text-[10px] text-white/60">{ship.imo}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[8px] uppercase tracking-widest text-white/20">船舶类型</div>
                <div className="truncate text-[10px] text-white/70">{ship.type}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[8px] uppercase tracking-widest text-white/20">长 / 宽</div>
                <div className="font-mono text-[10px] text-white/70">{ship.length} / {ship.width}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[8px] uppercase tracking-widest text-white/20">载重吨位</div>
                <div className="text-[10px] text-white/70">
                  {ship.grossTonnage} <span className="font-black opacity-40">GT</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[8px] uppercase tracking-widest text-white/20">主要载货</div>
                <div className="truncate text-[10px] text-white/75">{ship.cargo}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20">
            <FileText size={12} className="text-sky-400" />
            业务估计与申报信息
          </div>
          <div className="rounded-xl border border-white/5 bg-sky-500/[0.02] p-3 shadow-inner">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/5 p-2">
                <div className="mb-1 text-[8px] uppercase tracking-widest text-white/20">预计抵港 (ETA)</div>
                <div className="font-mono text-[10px] font-bold text-emerald-400">{ship.businessInfo.eta}</div>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <div className="mb-1 text-[8px] uppercase tracking-widest text-white/20">计划靠泊位置</div>
                <div className="text-[10px] font-bold text-white/70">{ship.businessInfo.plannedBerth}</div>
              </div>
              <div className="col-span-2 flex items-center justify-between px-1 text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="text-white/30">所属公司:</span>
                  <span className="font-medium text-white/60">{ship.businessInfo.operator}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/30">代理人:</span>
                  <span className="font-medium text-white/60">{ship.businessInfo.applicant}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20">
              <MessageSquare size={12} className="text-sky-400" />
              最新 VHF 对话摘要
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#12141a] p-3 italic shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-400/50">Live Feed</span>
              <span className="font-mono text-[10px] text-white/20">CH16</span>
            </div>
            <p className="text-[11px] leading-relaxed text-white/70">“{ship.vhfSummary}”</p>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20">
              <Clock size={12} className="text-sky-400" />
              全生命周期事件轴
            </div>
            <span className="text-[10px] uppercase text-white/30">Inbound → Present</span>
          </div>
          <div className="relative space-y-4 pl-4">
            <div className="absolute bottom-2 left-1.5 top-2 w-px bg-white/10" />
            {ship.dynamicEvents.map((event) => (
              <div key={event.id} className="group relative">
                <div
                  className={`absolute -left-[14px] top-1 z-10 h-2 w-2 rounded-full border-2 border-[#0a0a0a] ${
                    event.level === 'risk'
                      ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                      : event.level === 'warning'
                        ? 'bg-amber-500'
                        : event.type === 'navigation'
                          ? 'bg-emerald-500'
                          : 'bg-sky-500'
                  }`}
                />

                <button
                  onClick={() => onSelectTrackPoint(event.trackPointId)}
                  className="flex w-full flex-col items-start gap-1 rounded-lg border border-white/5 bg-white/[0.02] p-2 text-left transition-all hover:bg-white/[0.04]"
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span
                      className={`rounded px-1 text-[10px] font-black uppercase tracking-widest ${
                        event.type === 'navigation'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : event.type === 'safety'
                            ? 'bg-red-500/10 text-red-400'
                            : event.type === 'business'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-sky-500/10 text-sky-400'
                      }`}
                    >
                      {event.type}
                    </span>
                    <span className="font-mono text-[10px] text-white/20">{event.time.split(' ').pop()}</span>
                  </div>
                  <div className="text-[11px] font-bold leading-snug text-white/80">{event.text}</div>
                  {event.trackPointId && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase text-sky-500/40">
                      <MapPin size={8} /> Linked Track Point
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
