import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, AlertTriangle, ChevronDown, Info, X } from 'lucide-react';
import type { Alert } from '../../../types';

type WarningListPanelProps = {
  alerts: Alert[];
  selectedAlert: string | null;
  onToggleAlert: (alertId: string) => void;
  onCloseAlert: () => void;
};

const getLevelMeta = (level: Alert['level']) => {
  if (level === 'emergency') {
    return {
      icon: <AlertCircle size={14} />,
      badge: '紧急',
      badgeClass: 'bg-red-500/10 border-red-500/20 text-red-400',
      textClass: 'text-red-400',
      iconClass: 'bg-red-500/20 text-red-400',
    };
  }
  if (level === 'alarm') {
    return {
      icon: <AlertTriangle size={14} />,
      badge: '警报',
      badgeClass: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
      textClass: 'text-orange-400',
      iconClass: 'bg-orange-500/20 text-orange-400',
    };
  }
  if (level === 'warning') {
    return {
      icon: <AlertTriangle size={14} />,
      badge: '警告',
      badgeClass: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
      textClass: 'text-yellow-400',
      iconClass: 'bg-yellow-500/20 text-yellow-400',
    };
  }
  return {
    icon: <Info size={14} />,
    badge: '注意',
    badgeClass: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    textClass: 'text-blue-400',
    iconClass: 'bg-blue-500/20 text-blue-400',
  };
};

export default function WarningListPanel({
  alerts,
  selectedAlert,
  onToggleAlert,
  onCloseAlert,
}: WarningListPanelProps) {
  return (
    <div className="flex h-full flex-col space-y-3 p-4">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="grid grid-cols-4 gap-1">
            <div className="rounded-md border border-red-500/20 bg-red-500/10 p-1 text-center">
              <div className="text-sm font-bold text-red-500">{alerts.filter((a) => a.level === 'emergency').length}</div>
              <div className="text-[7px] font-bold uppercase text-red-500/70">紧急</div>
            </div>
            <div className="rounded-md border border-orange-500/20 bg-orange-500/10 p-1 text-center">
              <div className="text-sm font-bold text-orange-500">{alerts.filter((a) => a.level === 'alarm').length}</div>
              <div className="text-[7px] font-bold uppercase text-orange-500/70">警报</div>
            </div>
            <div className="rounded-md border border-yellow-500/20 bg-yellow-500/10 p-1 text-center">
              <div className="text-sm font-bold text-yellow-500">{alerts.filter((a) => a.level === 'warning').length}</div>
              <div className="text-[7px] font-bold uppercase text-yellow-500/70">警告</div>
            </div>
            <div className="rounded-md border border-blue-500/20 bg-blue-500/10 p-1 text-center">
              <div className="text-sm font-bold text-blue-500">{alerts.filter((a) => a.level === 'caution').length}</div>
              <div className="text-[7px] font-bold uppercase text-blue-500/70">注意</div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-white/5" />

      <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {alerts.map((alert, i) => {
            const levelMeta = getLevelMeta(alert.level);
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                layout
                onClick={() => onToggleAlert(alert.id)}
                className={`group relative cursor-pointer overflow-hidden rounded-xl border transition-all ${
                  selectedAlert === alert.id
                    ? 'border-white/20'
                    : 'border-white/5 hover:border-white/10'
                } bg-[#121212]`}
              >
                {selectedAlert === alert.id && (
                  <div className={`absolute left-0 top-0 bottom-0 w-1 z-20 ${levelMeta.textClass.replace('text-', 'bg-')}`} />
                )}
                <div className="bg-gradient-to-b from-white/[0.02] to-transparent pt-1.5 px-2 pb-0.5 relative z-10">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <div className="flex flex-col items-center gap-0.5 shrink-0">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full ${levelMeta.iconClass}`}>
                          {levelMeta.icon}
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-tighter px-1 rounded-sm border ${levelMeta.badgeClass}`}>
                          {levelMeta.badge}
                        </span>
                      </div>
                      
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        {/* 第一行：船名卡片 */}
                        <div className="flex items-center min-w-0 overflow-hidden">
                          <span className="flex items-center gap-1 rounded bg-white/5 border border-white/5 px-1.5 py-0.5 text-[10px] font-bold text-white/80 min-w-0 overflow-hidden">
                            <span className="truncate">{alert.ship}</span>
                            {alert.englishName && <span className="text-[9px] font-medium opacity-40 truncate">({alert.englishName})</span>}
                          </span>
                        </div>

                        {/* 第二行：船舶类型与物理尺寸 */}
                        <div className="flex items-center gap-x-2 whitespace-nowrap">
                          <span className="shrink-0 rounded bg-white/5 border border-white/5 px-1 py-0 text-[8px] font-normal uppercase tracking-wider text-white/40">{alert.shipType}</span>
                          <div className="flex items-center gap-x-1.5 opacity-30">
                            <span className="text-[10px] tracking-tighter">L:{alert.length}</span>
                            <span className="text-[10px] tracking-tighter">W:{alert.width}</span>
                            <span className="text-[10px] tracking-tighter">D:{alert.draft}</span>
                          </div>
                        </div>

                        {/* 第三行：预警类型、时间与航速 */}
                        <div className="flex items-center gap-x-2">
                          <span className={`text-[11px] font-black tracking-tight ${levelMeta.textClass}`}>{alert.type}</span>
                          <span className="font-mono text-[10px] text-white/20">{alert.time}</span>
                          <div className="flex items-center gap-1 ml-auto">
                            <div className="h-1 w-1 animate-pulse rounded-full bg-sky-500" />
                            <span className="text-[10px] font-bold tracking-tighter text-sky-400">S:{alert.speed}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add ignore logic here
                      }}
                      className="p-1 rounded-md bg-red-500/10 text-red-500/60 hover:bg-red-500/20 hover:text-red-500 transition-all shrink-0 self-start"
                      title="忽略预警"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {selectedAlert === alert.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-white/5"
                    >
                      <div className="space-y-1.5 px-2 py-1.5">
                        <div className="px-1 py-0">
                          <div className="space-y-1 py-0.5">
                            {/* 第一行：身份标识 (MMSI | 呼号 | IMO) */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-tighter text-white/20">MMSI</span>
                                <span className="font-mono text-[10px] leading-tight text-white/80">{alert.mmsi || '--'}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-tighter text-white/20">呼号</span>
                                <span className="font-mono text-[10px] leading-tight text-white/80">{alert.callsign || '--'}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-tighter text-white/20">IMO</span>
                                <span className="font-mono text-[10px] leading-tight text-white/80">{alert.imo || '--'}</span>
                              </div>
                            </div>

                            {/* 第二行：物理规格 (船籍 | 尺度 | 吃水) */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-tighter text-white/20">船籍</span>
                                <span className="truncate text-[10px] leading-tight text-white/80">{alert.flag || '--'}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-tighter text-white/20">尺度 (L×W)</span>
                                <span className="text-[10px] leading-tight text-white/80">{alert.length}×{alert.width}m</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-tighter text-white/20">吃水</span>
                                <span className="text-[10px] leading-tight text-white/80">{alert.draft}m</span>
                              </div>
                            </div>

                            {/* 第三行：航行与业务 (航程 | 货物 | 载重) */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-tighter text-white/20">航程</span>
                                <div className="flex items-center gap-1 text-[10px] leading-tight text-white/80">
                                  <span className="truncate max-w-[32px]">{alert.lastPort || '--'}</span>
                                  <span className="text-white/20">→</span>
                                  <span className="truncate max-w-[32px]">{alert.destination || '--'}</span>
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-tighter text-white/20">货物</span>
                                <span className="truncate text-[10px] leading-tight text-white/80">{alert.cargo || '--'}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-tighter text-white/20">载重 (DWT)</span>
                                <span className="truncate text-[10px] leading-tight text-white/80">{alert.dwt || '--'}t</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="h-px bg-white/5" />

                        <div className="space-y-1.5">
                          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/40">预警时间轴</div>
                          {alert.timeline.map((event, idx) => (
                            <div key={idx} className="group/item relative pl-3.5">
                              {idx !== alert.timeline.length - 1 && (
                                <div className="absolute bottom-[-12px] left-[1.5px] top-2.5 w-[1px] bg-white/5" />
                              )}
                              <div className={`absolute left-0 top-1 h-1 w-1 rounded-full border transition-all duration-500 ${
                                event.type === 'risk'
                                  ? 'border-red-400 bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]'
                                  : event.type === 'warning'
                                    ? 'border-orange-400 bg-orange-500'
                                    : 'border-white/20 bg-white/10'
                              }`} />
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1">
                                  <span className="font-mono text-[8px] text-white/30">{event.time}</span>
                                  <div className={`rounded border px-1 py-1 text-[7px] font-black uppercase tracking-widest ${
                                    event.type === 'risk'
                                      ? 'border-red-500/20 bg-red-500/10 text-red-400'
                                      : event.type === 'warning'
                                        ? 'border-orange-500/20 bg-orange-500/10 text-orange-400'
                                        : 'border-white/5 bg-white/5 text-white/40'
                                  }`}>
                                    {event.type === 'risk' ? '风险触发' : event.type === 'warning' ? '异常检测' : '常规记录'}
                                  </div>
                                </div>
                                <p className={`text-[10px] leading-relaxed transition-colors ${
                                  event.type === 'risk' ? 'text-white/80' : 'text-white/40'
                                }`}>
                                  {event.event}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-center border-t border-white/5 pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCloseAlert();
                            }}
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-sky-500/60 transition-colors hover:text-sky-400"
                          >
                            收起详情 <ChevronDown size={8} className="rotate-180" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
