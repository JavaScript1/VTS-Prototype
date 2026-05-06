import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, ChevronDown, LocateFixed, Shield, Ship, X } from 'lucide-react';
import type { IntentItem } from '../../../types';

type IntentListPanelProps = {
  intents: IntentItem[];
  intentFilter: string;
  selectedIntent: number | null;
  editingIntentIndex: number | null;
  onIntentFilterChange: (value: string) => void;
  onToggleIntent: (index: number) => void;
  onCloseIntent: () => void;
  getCompactIntentLine: (item: IntentItem) => string;
  getCompactRiskLines: (
    item: IntentItem,
  ) => Array<{ tone: string; label: string; text: string }>;
};

export default function IntentListPanel({
  intents,
  intentFilter,
  selectedIntent,
  editingIntentIndex,
  onIntentFilterChange,
  onToggleIntent,
  onCloseIntent,
  getCompactIntentLine,
  getCompactRiskLines,
}: IntentListPanelProps) {
  return (
    <div className="flex h-full flex-col space-y-3 p-4">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="relative">
            <select
              value={intentFilter}
              onChange={(e) => onIntentFilterChange(e.target.value)}
              className="w-full appearance-none rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] font-bold text-white/80 transition-all hover:bg-white/10 focus:border-sky-500/50 focus:outline-none"
            >
              {['全部', '起锚', '划江', '靠泊', '离泊', '抛锚', '穿越', '避让'].map((filter) => (
                <option key={filter} value={filter} className="bg-[#0a0a0a] text-white">
                  {filter === '全部' ? '全部意图种类' : filter}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/20">
              <ChevronDown size={12} />
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-white/5" />

      <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {intents
            .filter((item) => {
              if (intentFilter === '全部') return true;
              const activeAction = item.path.find((p) => p.status === 'active')?.action || '';
              return activeAction.includes(intentFilter);
            })
            .map((item, i) => (
              <motion.div
                key={`${item.ship}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                layout
                onClick={() => {
                  if (editingIntentIndex !== i) onToggleIntent(i);
                }}
                className={`group relative cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-[#121212] transition-all hover:border-white/10 ${
                  selectedIntent === i ? 'ring-1 ring-sky-500/30' : ''
                }`}
              >
                <div className="bg-gradient-to-b from-white/[0.02] to-transparent p-2">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 shrink-0">
                        <Ship size={14} className="text-sky-400" />
                      </div>
                      <div className="flex min-w-0 flex-col gap-1">
                        {/* Line 1: Ship Name and English Name */}
                        <div className="flex items-center min-w-0 overflow-hidden">
                          <span className="flex items-center gap-1 text-[11px] font-bold text-white/90 min-w-0 overflow-hidden">
                            <span className="truncate">{item.ship}</span>
                            {item.englishName && <span className="text-[10px] font-medium opacity-40 truncate">({item.englishName})</span>}
                          </span>
                        </div>

                        {/* Line 2: Ship Type and Physical Dimensions */}
                        <div className="flex items-center gap-x-2 whitespace-nowrap">
                          <span className="shrink-0 text-[8px] font-normal uppercase tracking-wider text-white/40">{item.shipType}</span>
                          <div className="flex items-center gap-x-1.5 opacity-30">
                            <span className="text-[10px] tracking-tighter">L:{item.length}</span>
                            <span className="text-[10px] tracking-tighter">W:{item.width}</span>
                            <span className="text-[10px] tracking-tighter">D:{item.draft}</span>
                          </div>
                        </div>

                        {/* Line 3: Active Action and Time */}
                        <div className="flex items-center gap-x-2">
                          <span className="text-xs font-black text-white">
                            {item.path.find((p) => p.status === 'active')?.action || '正在执行'}
                          </span>
                          <span className="font-mono text-[10px] text-white/30">{item.occurrenceTime.split(' ')[1]}</span>
                          <div className="flex items-center gap-1 ml-auto">
                            <div className="h-1 w-1 animate-pulse rounded-full bg-sky-500" />
                            <span className="text-[10px] font-bold tracking-tighter text-sky-400">S:{item.speed}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-full border border-white/5 bg-white/5 px-1.5 py-0.5 shrink-0 self-start">
                      <div className="h-1 w-1 animate-pulse rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/60">实时</span>
                    </div>
                  </div>

                  <div className="relative mb-2 mt-1 px-3">
                    <div className="absolute left-0 right-0 top-[5px] h-[1px] bg-white/10" />
                    <div className="absolute left-0 top-[5px] h-[1px] bg-sky-500 transition-all duration-1000" style={{ width: '50%' }} />
                    <div className="relative z-10 flex justify-between">
                      {[item.past, item.current, item.destination].map((label, index) => (
                        <div key={`${label}-${index}`} className="flex flex-col items-center gap-1">
                          <div className="flex h-2.5 items-center justify-center">
                            {index === 1 ? (
                              <div className="relative">
                                <div className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]">
                                  <div className="h-1 w-1 rounded-full bg-white" />
                                </div>
                                <div className="absolute inset-0 animate-pulse bg-sky-400 opacity-30 blur-sm" />
                              </div>
                            ) : (
                              <div className={`h-1.5 w-1.5 rounded-full border ${index === 0 ? 'border-sky-500/60 bg-sky-500/40' : 'border-white/10 bg-white/5'}`} />
                            )}
                          </div>
                          <div className="text-center">
                            <div className={`whitespace-nowrap text-[10px] font-bold ${index === 1 ? 'text-sky-400 font-black' : 'text-white/40'}`}>
                              {label}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {selectedIntent === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-white/5"
                    >
                      <div className="space-y-1.5 bg-transparent p-2">
                        <div className="px-2 py-0">
                          <div className="space-y-1 py-0.5">
                            {/* 第一行：身份标识 (MMSI | 呼号 | IMO) */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-tighter text-white/20">MMSI</span>
                                <span className="font-mono text-[10px] leading-tight text-white/80">{item.mmsi || '--'}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-tighter text-white/20">呼号</span>
                                <span className="font-mono text-[10px] leading-tight text-white/80">{item.callSign || '--'}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-tighter text-white/20">IMO</span>
                                <span className="font-mono text-[10px] leading-tight text-white/80">{item.imo || '--'}</span>
                              </div>
                            </div>

                            {/* 第二行：物理规格 (船籍 | 尺度 | 吃水) */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-tighter text-white/20">船籍</span>
                                <span className="truncate text-[10px] leading-tight text-white/80">{item.flag || '--'}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-tighter text-white/20">尺度 (L×W)</span>
                                <span className="text-[10px] leading-tight text-white/80">{item.length}×{item.width}m</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-tighter text-white/20">吃水</span>
                                <span className="text-[10px] leading-tight text-white/80">{item.draft}m</span>
                              </div>
                            </div>

                            {/* 第三行：航行与业务 (航程 | 货物 | 载重) */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-tighter text-white/20">航程</span>
                                <div className="flex items-center gap-1 text-[10px] leading-tight text-white/80">
                                  <span className="truncate max-w-[32px]">{item.past || '--'}</span>
                                  <span className="text-white/20">→</span>
                                  <span className="truncate max-w-[32px]">{item.destination || '--'}</span>
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-tighter text-white/20">货物</span>
                                <span className="truncate text-[10px] leading-tight text-white/80">{item.cargo || '--'}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-tighter text-white/20">载重 (DWT)</span>
                                <span className="truncate text-[10px] leading-tight text-white/80">{item.dwt || '--'}t</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-lg border border-sky-500/15 bg-sky-500/[0.06] px-2 py-1.5">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-white">
                            <LocateFixed size={10} className="shrink-0 text-sky-400" />
                            <span className="shrink-0 text-sky-300/90">意图：</span>
                            <span className="truncate">{getCompactIntentLine(item)}</span>
                          </div>
                        </div>
                        <div className="rounded-lg border border-red-500/15 bg-red-500/[0.04] px-2 py-1.5">
                          <div className="space-y-1 text-[10px] font-bold text-white">
                            {getCompactRiskLines(item).map((risk, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                {idx === 0 ? <AlertTriangle size={10} className="shrink-0 text-red-400" /> : <div className="w-[10px] shrink-0" />}
                                <span className={risk.tone === 'high' ? 'shrink-0 text-red-300/90' : 'shrink-0 text-amber-300/90'}>
                                  {risk.label}
                                </span>
                                <span className="truncate">{risk.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.05] px-2 py-1.5">
                          <div className="flex items-start gap-1.5 text-[10px] font-bold text-white/92">
                            <Shield size={10} className="mt-[1px] shrink-0 text-emerald-400" />
                            <span className="shrink-0 text-emerald-300/90">建议：</span>
                            <span className="min-w-0 whitespace-normal break-words leading-relaxed">{item.recommendation.action}</span>
                          </div>
                        </div>
                        <div className="flex justify-center border-t border-white/5 pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCloseIntent();
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
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
