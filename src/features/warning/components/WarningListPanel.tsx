import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, AlertTriangle, ChevronDown, Info } from 'lucide-react';
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
                className={`group relative cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-[#121212] transition-all hover:border-white/10 ${
                  selectedAlert === alert.id
                    ? 'ring-1 ring-sky-500/30'
                    : alert.level === 'emergency'
                      ? 'ring-1 ring-red-500/20'
                      : alert.level === 'alarm'
                        ? 'ring-1 ring-orange-500/20'
                        : alert.level === 'warning'
                          ? 'ring-1 ring-yellow-500/20'
                          : ''
                }`}
              >
                <div className="bg-gradient-to-b from-white/[0.02] to-transparent p-2">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full ${levelMeta.iconClass}`}>
                        {levelMeta.icon}
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="truncate text-[10px] font-bold text-white/40">{alert.ship}</span>
                          <span className="shrink-0 rounded bg-white/10 px-1 text-[10px] uppercase tracking-wider">{alert.shipType}</span>
                          <div className="ml-auto flex items-center gap-1">
                            <div className="h-1 w-1 animate-pulse rounded-full bg-sky-500" />
                            <span className="text-[10px] font-bold tracking-tighter text-sky-400">S:{alert.speed}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-30">
                          <span className="text-[10px] tracking-tighter">L:{alert.length}</span>
                          <span className="text-[10px] tracking-tighter">W:{alert.width}</span>
                          <span className="text-[10px] tracking-tighter">D:{alert.draft}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className={`text-xs font-black ${levelMeta.textClass}`}>{alert.type}</span>
                          <span className="font-mono text-[10px] text-white/30">{alert.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 rounded-full border px-1.5 py-1 ${levelMeta.badgeClass}`}>
                      <div className={`h-1 w-1 animate-pulse rounded-full ${levelMeta.textClass.replace('text-', 'bg-')}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{levelMeta.badge}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex gap-1.5 px-1">
                    <button className="flex-1 rounded-lg border border-white/5 bg-white/5 py-1 text-[10px] font-bold text-white/60 transition-colors hover:bg-white/10">
                      定位船舶
                    </button>
                    <button className="flex-1 rounded-lg border border-white/5 bg-white/5 py-1 text-[10px] font-bold text-white/60 transition-colors hover:bg-white/10">
                      忽略预警
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
                      <div className="space-y-4 p-3">
                        <div className="rounded-lg border border-white/5 bg-white/[0.02] px-2 py-2">
                          <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
                            <div className="space-y-0.5">
                              <div className="text-[10px] uppercase tracking-widest text-white/30">MMSI</div>
                              <div className="font-mono text-[10px] text-white/75">{alert.mmsi || '--'}</div>
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-[10px] uppercase tracking-widest text-white/30">呼号</div>
                              <div className="font-mono text-[10px] text-white/75">{alert.callsign || '--'}</div>
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-[10px] uppercase tracking-widest text-white/30">船籍</div>
                              <div className="text-[10px] text-white/75">{alert.flag || '--'}</div>
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-[10px] uppercase tracking-widest text-white/30">最大吃水</div>
                              <div className="text-[10px] text-white/75">{alert.draft}</div>
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-[10px] uppercase tracking-widest text-white/30">长/宽</div>
                              <div className="text-[10px] text-white/75">{alert.length}/{alert.width}</div>
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-[10px] uppercase tracking-widest text-white/30">代理</div>
                              <div className="truncate text-[10px] text-white/75">{alert.agent || '--'}</div>
                            </div>
                            <div className="col-span-2 space-y-0.5">
                              <div className="text-[10px] uppercase tracking-widest text-white/30">目的港</div>
                              <div className="text-[10px] text-white/75">{alert.destination}</div>
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-[10px] uppercase tracking-widest text-white/30">风险指数</div>
                              <div className="text-[10px] font-bold text-red-400">{alert.riskScore}</div>
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
