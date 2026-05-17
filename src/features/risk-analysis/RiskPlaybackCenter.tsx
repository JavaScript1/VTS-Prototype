/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronRight, History, Search } from 'lucide-react';
import DynamicPlaybackView from '../../components/Panels/DynamicPlaybackView';
import { MOCK_RISK_STATS } from '../../mockData';
import { getRiskPlaybackSession } from '../app/utils/playback';

type RiskPlaybackCenterProps = {
  onOpenPlayback: (index: number) => void;
  mode?: 'warning' | 'collision';
};

const isCollisionRisk = (risk: string) => risk.includes('碰撞');

export default function RiskPlaybackCenter({
  onOpenPlayback: _onOpenPlayback,
  mode = 'warning',
}: RiskPlaybackCenterProps) {
  const isCollisionMode = mode === 'collision';
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(
    MOCK_RISK_STATS.find((item) =>
      isCollisionMode ? isCollisionRisk(item.risk) : !isCollisionRisk(item.risk),
    )?.id ?? null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('全部');

  const categories = isCollisionMode
    ? ['全部', '碰撞风险']
    : ['全部', '区域入侵', '航道超速', '走锚告警', '实况场景'];

  const panelTitle = isCollisionMode ? '碰撞预警中心' : '预警回放中心';
  const searchPlaceholder = isCollisionMode ? '搜索碰撞船舶、会遇风险...' : '搜索船舶名称、预警类型...';
  const panelIcon = isCollisionMode ? AlertTriangle : History;
  const panelIconClass = isCollisionMode
    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
    : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20';
  const activeButtonClass = isCollisionMode
    ? 'bg-rose-500 text-white shadow-sm'
    : 'bg-indigo-500 text-white shadow-sm';
  const activeCardClass = isCollisionMode
    ? 'border-rose-200 bg-rose-50 ring-1 ring-rose-200'
    : 'border-indigo-200 bg-indigo-50 ring-1 ring-indigo-200';
  const activeTitleClass = isCollisionMode ? 'text-rose-600' : 'text-indigo-600';
  const activeRiskClass = isCollisionMode ? 'text-rose-500/80' : 'text-indigo-500/80';
  const activeChevronClass = isCollisionMode ? 'text-rose-400' : 'text-indigo-400';

  const filteredCases = useMemo(() => {
    return MOCK_RISK_STATS.filter((item) => {
      const matchesMode = isCollisionMode ? isCollisionRisk(item.risk) : !isCollisionRisk(item.risk);
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.risk.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        category === '全部' ||
        (category === '实况场景' && item.isImageScenario) ||
        (category !== '实况场景' &&
          item.risk.includes(category.replace('风险', '').replace('告警', '')));
      return matchesMode && matchesSearch && matchesCategory;
    });
  }, [category, isCollisionMode, searchQuery]);

  const selectedCase = useMemo(() => {
    const activeId = filteredCases.some((item) => item.id === selectedCaseId)
      ? selectedCaseId
      : filteredCases[0]?.id ?? null;
    if (!activeId) return null;
    return MOCK_RISK_STATS.find((item) => item.id === activeId) ?? null;
  }, [filteredCases, selectedCaseId]);

  const playbackSession = useMemo(
    () => (selectedCase ? getRiskPlaybackSession(selectedCase) : null),
    [selectedCase],
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50">
      <aside className="flex w-80 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-14 items-center gap-3 border-b border-slate-100 px-6">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${panelIconClass}`}>
            <panelIcon size={18} />
          </div>
          <span className="text-sm font-black tracking-widest text-slate-800">{panelTitle}</span>
        </div>

        <div className="space-y-4 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-medium outline-none transition-all focus:bg-white focus:ring-2 ${
                isCollisionMode
                  ? 'focus:border-rose-500 focus:ring-rose-500/10'
                  : 'focus:border-indigo-500 focus:ring-indigo-500/10'
              }`}
            />
          </div>

          <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-4">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                  category === item
                    ? activeButtonClass
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="custom-scrollbar-light flex-1 space-y-2 overflow-y-auto px-4 pb-4">
          {filteredCases.map((item) => {
            const active = selectedCaseId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedCaseId(item.id)}
                className={`group flex w-full flex-col gap-2 rounded-xl border p-3 text-left transition-all ${
                  active
                    ? activeCardClass
                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black ${active ? activeTitleClass : 'text-slate-700'}`}>
                      {item.name}
                    </span>
                    {item.isImageScenario ? (
                      <span className="rounded-full border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold text-amber-600">
                        实况
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[9px] font-medium text-slate-400">{item.time.split(' ')[0]}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className={`truncate text-[10px] font-bold ${active ? activeRiskClass : 'text-slate-400'}`}>
                    {item.risk}
                  </div>
                  <ChevronRight size={12} className={active ? activeChevronClass : 'text-slate-300'} />
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <main className="relative min-w-0 flex-1 bg-slate-50 p-4">
        <div className="relative h-full overflow-hidden rounded-[28px] border border-slate-200 bg-black shadow-sm">
          {playbackSession ? (
            <DynamicPlaybackView
              session={playbackSession}
              onClose={() => undefined}
              embedded
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-black text-white/70">
              暂无可播放的预警案例
            </div>
          )}
        </div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .custom-scrollbar-light::-webkit-scrollbar {
              width: 4px;
            }
            .custom-scrollbar-light::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar-light::-webkit-scrollbar-thumb {
              background: rgba(0, 0, 0, 0.05);
              border-radius: 10px;
            }
            .custom-scrollbar-light::-webkit-scrollbar-thumb:hover {
              background: rgba(0, 0, 0, 0.1);
            }
          `,
        }}
      />
    </div>
  );
}
