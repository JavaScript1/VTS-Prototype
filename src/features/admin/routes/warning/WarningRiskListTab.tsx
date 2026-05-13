import React, { useMemo, useState } from 'react';
import { Clock3, FileSpreadsheet, MapPin, Search, ShieldAlert, Ship, Siren, TriangleAlert } from 'lucide-react';
import type { MockRiskStat } from '../../../../types';
import { getRiskLevel } from './utils';
import { buildDisplayRisks, buildPageNumbers, PAGE_SIZE, type DisplayRiskRow, type RiskStatusType } from './warningRiskListData';
import { FilterSelect, RISK_LEVEL_STYLES } from './SharedComponents';

type WarningRiskListTabProps = {
  risks: MockRiskStat[];
  selectedRiskId: string | null;
  onSelectRisk: (riskId: string | null) => void;
  onPlayback: (item: MockRiskStat) => void;
};

const STATUS_STYLES: Record<RiskStatusType, string> = {
  报警中: 'bg-[#ff4f86]',
  已关闭: 'bg-[#1ee6a0]',
};

export default function WarningRiskListTab({
  risks,
  selectedRiskId,
  onSelectRisk,
  onPlayback,
}: WarningRiskListTabProps) {
  const [timeRange, setTimeRange] = useState('今天');
  const [regionFilter, setRegionFilter] = useState('全部');
  const [riskTypeFilter, setRiskTypeFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [falsePositiveFilter, setFalsePositiveFilter] = useState('全部');
  const [levelFilter, setLevelFilter] = useState('全部');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const allRisks = useMemo(() => buildDisplayRisks(risks), [risks]);
  const regionOptions = useMemo(
    () => ['全部', ...Array.from(new Set(allRisks.map((item) => item.snapshot.location)))],
    [allRisks],
  );
  const riskTypeOptions = useMemo(
    () => ['全部', ...Array.from(new Set(allRisks.map((item) => item.risk)))],
    [allRisks],
  );

  const filteredRisks = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return allRisks.filter((item) => {
      const level = getRiskLevel(item.riskScore);
      const matchesSearch =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.englishName.toLowerCase().includes(keyword) ||
        item.mmsi.includes(keyword);
      const matchesTime = timeRange === '今天' || timeRange === '近3天' || timeRange === '近7天';
      const matchesRegion = regionFilter === '全部' || item.snapshot.location === regionFilter;
      const matchesRiskType = riskTypeFilter === '全部' || item.risk === riskTypeFilter;
      const matchesStatus = statusFilter === '全部' || item.displayStatus === statusFilter;
      const matchesFalsePositive =
        falsePositiveFilter === '全部' || item.falsePositive === falsePositiveFilter;
      const matchesLevel = levelFilter === '全部' || level === levelFilter;
      return (
        matchesSearch &&
        matchesTime &&
        matchesRegion &&
        matchesRiskType &&
        matchesStatus &&
        matchesFalsePositive &&
        matchesLevel
      );
    });
  }, [
    allRisks,
    falsePositiveFilter,
    levelFilter,
    regionFilter,
    riskTypeFilter,
    search,
    statusFilter,
    timeRange,
  ]);

  const stats = useMemo(() => {
    const counts = { 紧急: 0, 警报: 0, 警告: 0, 注意: 0 };
    filteredRisks.forEach((r) => {
      const lvl = getRiskLevel(r.riskScore) as keyof typeof counts;
      if (counts[lvl] !== undefined) counts[lvl]++;
    });
    return counts;
  }, [filteredRisks]);

  const totalPages = Math.max(1, Math.ceil(filteredRisks.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const currentPageItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredRisks.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRisks, safeCurrentPage]);
  const pageNumbers = buildPageNumbers(safeCurrentPage, totalPages);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/6 bg-[#111822] px-3.5 py-2.5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <FilterSelect
              icon={<Clock3 size={12} className="text-[#18c4ff]" />}
              value={timeRange}
              options={['今天', '近3天', '近7天']}
              onChange={(value) => {
                setTimeRange(value);
                setCurrentPage(1);
              }}
            />
            <FilterSelect
              icon={<MapPin size={12} className="text-[#18c4ff]" />}
              value={regionFilter}
              options={regionOptions}
              onChange={(value) => {
                setRegionFilter(value);
                setCurrentPage(1);
              }}
            />
            <FilterSelect
              icon={<TriangleAlert size={12} className="text-[#b38cff]" />}
              value={riskTypeFilter}
              options={riskTypeOptions}
              onChange={(value) => {
                setRiskTypeFilter(value);
                setCurrentPage(1);
              }}
            />
            <FilterSelect
              icon={<Siren size={12} className="text-[#34d399]" />}
              value={statusFilter}
              options={['全部', '报警中', '已关闭']}
              onChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            />
            <FilterSelect
              icon={<ShieldAlert size={12} className="text-[#f6c343]" />}
              value={levelFilter}
              options={['全部', '紧急', '警报', '警告', '注意']}
              onChange={(value) => {
                setLevelFilter(value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="group relative">
              <Search
                size={12}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/22 group-focus-within:text-[#18c4ff]"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="搜索船名/MMSI..."
                className="w-44 rounded-xl border border-white/8 bg-[#111823] py-1.5 pl-8 pr-3 text-[11px] text-white/78 outline-none transition-all placeholder:text-white/22 focus:border-[#167dff]/60"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-[#18bfff] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-md transition-all hover:bg-[#35c8ff]">
              <FileSpreadsheet size={13} />
              导出
            </button>
          </div>
        </div>

        {/* 快速统计栏 - 微观与宏观数据联动 */}
        <div className="mt-2 flex items-center gap-4 border-t border-white/5 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">当前过滤统计:</span>
            <span className="text-[10px] font-black text-white">{filteredRisks.length} <span className="text-[8px] font-normal text-white/30">条记录</span></span>
          </div>
          <div className="h-2.5 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            {(['紧急', '警报', '警告', '注意'] as const).map((lvl) => (
              <div key={lvl} className="flex items-center gap-1.5">
                <span className={`h-1 w-1 rounded-full ${RISK_LEVEL_STYLES[lvl].dot} shadow-[0_0_6px_currentColor]`} />
                <span className="text-[10px] text-white/50">{lvl}</span>
                <span className={`text-[10px] font-bold ${RISK_LEVEL_STYLES[lvl].text}`}>{stats[lvl]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#1a2733] bg-[#121821] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-[#1a212d] text-[9px] font-black uppercase tracking-widest text-white/20">
                <th className="px-4 py-2 text-center">触发时间</th>
                <th className="px-4 py-2 text-left">目标船舶</th>
                <th className="px-4 py-2 text-left">风险等级</th>
                <th className="px-4 py-2 text-left">发生区域</th>
                <th className="px-4 py-2 text-left">状态</th>
                <th className="px-4 py-2 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {currentPageItems.map((ship) => {
                const level = getRiskLevel(ship.riskScore);
                const selected = selectedRiskId === ship.id;
                const levelStyle = RISK_LEVEL_STYLES[level];
                return (
                  <tr
                    key={ship.id}
                    className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] cursor-pointer ${
                      selected ? 'bg-[#182230]' : ''
                    }`}
                    onClick={() => onSelectRisk(selected ? null : ship.id)}
                  >
                    <td className="px-4 py-2 text-center font-mono text-[12px] text-white/40">
                      {ship.time}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${levelStyle.bg} ${levelStyle.text}`}>
                          <Ship size={13} />
                        </div>
                        <div>
                          <div className="text-[12px] font-bold text-white">
                            {ship.englishName}
                            <span className="ml-1 text-[10px] font-normal text-white/50">{ship.risk}</span>
                          </div>
                          <div className="mt-0.5 font-mono text-[10px] text-white/25">
                            {ship.mmsi} / {ship.type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-black ${levelStyle.border} ${levelStyle.bg} ${levelStyle.text}`}>
                        {level}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-[12px] text-white/50">{ship.snapshot.location}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2 text-[12px] text-white/70">
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLES[ship.displayStatus]}`} />
                        {ship.displayStatus}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onPlayback(ship);
                          }}
                          className="rounded-lg border border-[#0a537d] bg-[#083652] px-2.5 py-1 text-[10px] font-bold text-[#18c4ff] transition-all hover:border-[#18c4ff] hover:bg-[#0d476b]"
                        >
                          回放
                        </button>
                        <button className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white/60 transition-all hover:bg-white/10">
                          标记
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-2.5 text-[11px] text-white/25">
          <span>显示 {currentPageItems.length} 条，共 {filteredRisks.length} 条记录</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, safeCurrentPage - 1))}
              disabled={safeCurrentPage === 1}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.05] transition-all hover:bg-white/[0.1] disabled:opacity-30"
            >
              ‹
            </button>
            {pageNumbers.map((page, idx) =>
              typeof page === 'number' ? (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-6 min-w-6 items-center justify-center rounded-lg px-1 text-[10px] font-black transition-all ${
                    page === safeCurrentPage
                      ? 'bg-[#167dff] text-white'
                      : 'bg-white/[0.05] text-white/40 hover:bg-white/[0.1]'
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span key={idx} className="px-0.5 text-white/10">
                  ...
                </span>
              ),
            )}
            <button
              onClick={() => setCurrentPage((page) => Math.min(totalPages, safeCurrentPage + 1))}
              disabled={safeCurrentPage === totalPages}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.05] transition-all hover:bg-white/[0.1] disabled:opacity-30"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

