import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ChevronRight, Radio, Ship } from 'lucide-react';
import type { VHFMessage, VhfSessionSummary } from '../../types';

type VhfPanelProps = {
  saabLinkageEnabled: boolean;
  selectedStation: string;
  vhfViewMode: 'list' | 'flow';
  vhfMessages: VHFMessage[];
  activeVhfSession: VhfSessionSummary | null;
  waitingVhfSessions: VhfSessionSummary[];
  onToggleSaabLinkage: () => void;
  onSelectedStationChange: (value: string) => void;
  onViewModeChange: (mode: 'list' | 'flow') => void;
  onSelectSession: (sessionId: string) => void;
};

export default function VhfPanel({
  saabLinkageEnabled,
  selectedStation,
  vhfViewMode,
  vhfMessages,
  activeVhfSession,
  waitingVhfSessions,
  onToggleSaabLinkage,
  onSelectedStationChange,
  onViewModeChange,
  onSelectSession,
}: VhfPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-white/5 p-2 text-[10px]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap font-black uppercase tracking-widest text-white/30">Saab联动</span>
            <button
              onClick={onToggleSaabLinkage}
              className={`relative h-4 w-7 shrink-0 rounded-full transition-all duration-300 ${saabLinkageEnabled ? 'bg-sky-500' : 'bg-white/10'}`}
            >
              <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all duration-300 ${saabLinkageEnabled ? 'left-3.5 shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'left-0.5'}`} />
            </button>
          </div>
          {saabLinkageEnabled && (
            <motion.div
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 py-1"
            >
              <select
                value={selectedStation}
                onChange={(e) => onSelectedStationChange(e.target.value)}
                className="cursor-pointer appearance-none border-none bg-transparent text-[10px] font-black text-sky-400 focus:outline-none"
              >
                <option value="10号台" className="bg-[#0a0a0a]">10号台</option>
                <option value="外高桥" className="bg-[#0a0a0a]">外高桥</option>
              </select>
              <ChevronDown size={8} className="text-sky-400/50" />
            </motion.div>
          )}
        </div>
        <div className="flex rounded-md bg-white/5 p-0.5">
          <button
            onClick={() => onViewModeChange('list')}
            className={`rounded px-2 py-1 text-[10px] font-black uppercase tracking-widest transition-all ${vhfViewMode === 'list' ? 'bg-sky-500 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            列表
          </button>
          <button
            onClick={() => onViewModeChange('flow')}
            className={`rounded px-2 py-1 text-[10px] font-black uppercase tracking-widest transition-all ${vhfViewMode === 'flow' ? 'bg-sky-500 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            对话流
          </button>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto space-y-2.5 p-1.5">
        {vhfViewMode === 'list' ? (
          [...vhfMessages].reverse().map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.isVTS ? 5 : -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`flex flex-col ${msg.isVTS ? 'items-end' : 'items-start'}`}
            >
              <div className={`mb-0.5 flex items-center gap-1.5 px-0.5 ${msg.isVTS ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className={`text-[10px] font-black tracking-tight ${msg.isVTS ? 'text-sky-400/80' : 'text-white/30'}`}>
                  {msg.sender}
                </span>
                <span className="font-mono text-[8px] text-white/15">{msg.time}</span>
              </div>

              <div className={`group relative max-w-[92%] rounded-lg border p-1.5 shadow-sm transition-all ${msg.isVTS ? 'rounded-tr-none border-sky-500/20 bg-sky-500/10' : 'rounded-tl-none border-white/5 bg-white/[0.02]'}`}>
                <div className={`flex ${msg.content.length > 20 ? 'items-center gap-2' : 'flex-wrap items-center gap-x-2'}`}>
                  {msg.isVTS ? (
                    <>
                      <div className="inline-flex shrink-0 items-center gap-1 rounded bg-black/10 px-1">
                        <Radio size={7} className="text-sky-400/60" />
                        <span className="font-mono text-[8px] font-bold text-white/20">{msg.duration}</span>
                      </div>
                      <p className={`text-[10px] leading-snug tracking-wide text-sky-50 ${msg.content.length > 20 ? 'flex-1 text-right' : ''}`}>
                        {msg.content}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={`text-[10px] leading-snug tracking-wide text-white/75 ${msg.content.length > 20 ? 'flex-1' : ''}`}>
                        {msg.content}
                      </p>
                      <div className="inline-flex shrink-0 items-center gap-1 rounded bg-black/10 px-1">
                        <Radio size={7} className="text-white/20" />
                        <span className="font-mono text-[8px] font-bold text-white/20">{msg.duration}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex h-full min-h-0 flex-col">
            <section className="min-h-0 flex-[1.5] overflow-hidden bg-[#080808]">
              {activeVhfSession ? (
                <div className="flex h-full flex-col">
                  <div className="border-b border-white/10 bg-[#0c0c0c] px-3 py-1.5">
                    <div className="mb-1.5 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/20">
                          <Ship size={18} className="text-sky-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <h3 className="text-[12px] font-black leading-tight text-white">{activeVhfSession.shipName}</h3>
                            {activeVhfSession.shipInfo?.englishName && (
                              <span className="text-[10px] font-bold uppercase leading-tight text-white/30">{activeVhfSession.shipInfo.englishName}</span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="shrink-0 rounded border border-sky-500/20 bg-sky-500/10 px-1 py-1 text-[10px] font-black uppercase tracking-widest text-sky-400">
                              {activeVhfSession.shipInfo?.shipType || '未知类型'}
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-white/40">
                              <span className="h-2 w-px bg-white/10" />
                              载货: <span className="text-white/60">{activeVhfSession.shipInfo?.cargoType || '--'}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-1 border-t border-white/5 pt-1.5">
                      <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
                        <div className="col-span-1 -mx-1 rounded-sm border-b border-white/5 bg-sky-500/[0.04] pb-1 pl-1">
                          <div className="text-[8px] uppercase tracking-widest text-sky-400/40">意图</div>
                          <div className="truncate text-[10px] font-black uppercase tracking-tighter text-sky-400">{activeVhfSession.intent}</div>
                        </div>
                        <div className="col-span-2 -mx-1 rounded-sm border-b border-white/5 bg-white/[0.01] pb-1 pl-2 pr-1">
                          <div className="text-[8px] uppercase tracking-widest text-white/10">航程 (上一港 / 下一港)</div>
                          <div className="truncate text-[10px] text-white/80">
                            <span className="text-white/40">{activeVhfSession.shipInfo?.lastPort || '--'}</span>
                            <span className="mx-1 text-sky-500/30">→</span>
                            <span className="font-bold text-sky-400">{activeVhfSession.shipInfo?.destination || '--'}</span>
                          </div>
                        </div>
                        <div className="space-y-0 border-r border-white/5 pr-1 pt-0.5">
                          <div className="text-[8px] uppercase tracking-widest text-white/20">呼号</div>
                          <div className="font-mono text-[10px] font-bold text-sky-300/90">{activeVhfSession.shipInfo?.callSign || '--'}</div>
                        </div>
                        <div className="space-y-0 border-r border-white/5 px-1 pt-0.5">
                          <div className="text-[8px] uppercase tracking-widest text-white/20">MMSI</div>
                          <div className="font-mono text-[10px] font-bold text-sky-300/90">{activeVhfSession.shipInfo?.mmsi || '----'}</div>
                        </div>
                        <div className="space-y-0 pl-1 pt-0.5">
                          <div className="text-[8px] uppercase tracking-widest text-white/20">IMO</div>
                          <div className="font-mono text-[10px] text-white/60">{activeVhfSession.shipInfo?.imo || '--'}</div>
                        </div>
                        <div className="space-y-0 border-r border-white/5 pr-1">
                          <div className="text-[8px] uppercase tracking-widest text-white/20">船籍</div>
                          <div className="text-[10px] font-medium text-white/75">{activeVhfSession.shipInfo?.flag || '--'}</div>
                        </div>
                        <div className="space-y-0 border-r border-white/5 px-1">
                          <div className="text-[8px] uppercase tracking-widest text-white/20">吃水</div>
                          <div className="font-mono text-[10px] font-bold text-orange-300/90">{activeVhfSession.shipInfo?.draft || '--'}</div>
                        </div>
                        <div className="space-y-0 pl-1">
                          <div className="text-[8px] uppercase tracking-widest text-white/20">长 / 宽</div>
                          <div className="font-mono text-[10px] text-orange-200/80">
                            {activeVhfSession.shipInfo?.length || '--'} <span className="text-white/20">/</span> {activeVhfSession.shipInfo?.width || '--'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="custom-scrollbar flex-1 min-h-0 space-y-3 overflow-y-auto bg-[#080808] px-3 py-3">
                    {activeVhfSession.messages.map((msg, idx) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: msg.isVTS ? 5 : -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className={`flex flex-col ${msg.isVTS ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`mb-0.5 flex items-center gap-1.5 px-0.5 ${msg.isVTS ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className={`text-[10px] font-black tracking-tight ${msg.isVTS ? 'text-sky-400/80' : 'text-white/30'}`}>
                            {msg.sender}
                          </span>
                          <span className="font-mono text-[8px] text-white/15">{msg.time}</span>
                        </div>

                        <div className={`group relative max-w-[92%] rounded-lg border p-1.5 shadow-sm transition-all ${msg.isVTS ? 'rounded-tr-none border-sky-400/20 bg-sky-500/10' : 'rounded-tl-none border-white/5 bg-[#1a1a1a]'}`}>
                          <div className={`flex ${msg.content.length > 20 ? 'items-center gap-2' : 'flex-wrap items-center gap-x-2'}`}>
                            {msg.isVTS ? (
                              <>
                                <div className="inline-flex shrink-0 items-center gap-1 rounded bg-black/20 px-1">
                                  <Radio size={7} className="text-sky-400/60" />
                                  <span className="font-mono text-[8px] font-bold text-white/20">{msg.duration}</span>
                                </div>
                                <p className={`text-[10px] leading-snug tracking-wide text-sky-50 ${msg.content.length > 20 ? 'flex-1 text-right' : ''}`}>
                                  {msg.content}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className={`text-[10px] leading-snug tracking-wide text-white/75 ${msg.content.length > 20 ? 'flex-1' : ''}`}>
                                  {msg.content}
                                </p>
                                <div className="inline-flex shrink-0 items-center gap-1 rounded bg-black/20 px-1">
                                  <Radio size={7} className="text-white/20" />
                                  <span className="font-mono text-[8px] font-bold text-white/20">{msg.duration}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center text-[11px] text-white/35">
                  当前没有正在进行的 VHF 会话。
                </div>
              )}
            </section>

            <section className="min-h-0 flex-[0.4] overflow-hidden border-t border-white/6 bg-[#080808]">
              <div className="flex items-center justify-between border-b border-white/5 bg-[#0a0a0a] px-3 py-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-[0.06em] text-white/20">等待对话船舶</span>
                </div>
                <span className="text-[10px] font-black text-white/15">共 {waitingVhfSessions.length} 条</span>
              </div>

              <div className="custom-scrollbar flex-1 min-h-0 overflow-y-auto">
                {waitingVhfSessions.length > 0 ? waitingVhfSessions.map((session, index) => {
                  const shipInfo = session.shipInfo;
                  return (
                    <motion.button
                      key={session.sessionId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => onSelectSession(session.sessionId)}
                      className="w-full border-b border-white/5 px-3 py-1 text-left transition-all hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[10px] font-black text-white/80">{session.shipName}</span>
                            {shipInfo?.englishName && (
                              <span className="truncate text-[10px] font-bold text-white/20">{shipInfo.englishName}</span>
                            )}
                          </div>
                          <div className="truncate text-[10px] text-white/30">
                            {session.messages.find((message) => !message.isVTS)?.content || session.messages[session.messages.length - 1]?.content || '暂无内容'}
                          </div>
                        </div>
                        <div className="shrink-0">
                          <span className="rounded border border-sky-500/20 bg-sky-500/10 px-1.5 py-1 text-[10px] font-black text-sky-400">
                            {session.intent}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  );
                }) : (
                  <div className="flex h-full items-center justify-center px-4 text-[11px] text-white/35">
                    当前没有等待中的 VHF 会话。
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
