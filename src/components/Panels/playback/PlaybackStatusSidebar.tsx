import { Activity, MessageSquare } from 'lucide-react';
import type { PlaybackSessionLike } from '../DynamicPlaybackView';

type PlaybackStatusSidebarProps = {
  session: PlaybackSessionLike;
  progress: number;
  currentPos: [number, number] | undefined;
};

export default function PlaybackStatusSidebar({
  session,
  progress,
  currentPos,
}: PlaybackStatusSidebarProps) {
  return (
    <div className="absolute right-8 top-24 z-[10] w-72 space-y-4">
      <div className="rounded-2xl border border-white/10 bg-black/60 p-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <Activity size={16} className="text-sky-400" />
          <h4 className="text-xs font-black uppercase tracking-wider text-white">
            实时状态监控
          </h4>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-2.5">
            <span className="text-[11px] font-bold uppercase text-white/40">当前经度</span>
            <span className="text-[11px] font-mono text-white/80">
              {currentPos?.[1].toFixed(5)}°E
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-2.5">
            <span className="text-[11px] font-bold uppercase text-white/40">当前纬度</span>
            <span className="text-[11px] font-mono text-white/80">
              {currentPos?.[0].toFixed(5)}°N
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-2.5">
            <span className="text-[11px] font-bold uppercase text-white/40">预警状态</span>
            <span
              className={`text-[11px] font-bold uppercase ${
                progress > 80 ? 'animate-pulse text-red-400' : 'text-emerald-400'
              }`}
            >
              {progress > 80 ? '风险触发' : '正常航行'}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/60 p-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare size={16} className="text-sky-400" />
          <h4 className="text-xs font-black uppercase tracking-wider text-white">
            历史通讯记录
          </h4>
        </div>
        <div className="custom-scrollbar max-h-48 space-y-2 overflow-y-auto pr-2">
          {session.event.dialogue.map((chat: any, idx: number) => (
            <div
              key={`${chat.sender}-${chat.time}-${idx}`}
              className={progress < (idx + 1) * 20 ? 'opacity-20' : 'opacity-100 transition-opacity duration-500'}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-white/30">
                  {chat.sender}
                </span>
                <span className="text-[10px] font-mono text-white/20">
                  {chat.time.split(' ')[1]}
                </span>
              </div>
              <p className="rounded-lg border border-white/5 bg-white/5 p-2 text-[11px] leading-relaxed text-white/70">
                {chat.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
