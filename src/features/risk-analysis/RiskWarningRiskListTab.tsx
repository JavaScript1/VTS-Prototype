import React, { useMemo, useState } from 'react';
import { Clock3, FileSpreadsheet, Search, ShieldAlert, Ship, Siren, TriangleAlert } from 'lucide-react';
import type { MockRiskStat } from '../../types';
import { getRiskLevel } from '../admin/routes/warning/utils';
import { buildDisplayRisks, buildPageNumbers, PAGE_SIZE, type RiskStatusType } from '../admin/routes/warning/warningRiskListData';
import { FilterSelect, RISK_LEVEL_STYLES } from './RiskSharedComponents';

type RiskWarningRiskListTabProps = {
  risks: MockRiskStat[];
  selectedRiskId: string | null;
  onSelectRisk: (riskId: string | null) => void;
  onPlayback: (item: MockRiskStat) => void;
};

const STATUS_STYLES: Record<RiskStatusType, string> = {
  报警中: 'bg-red-500',
  已关闭: 'bg-emerald-500',
};

type JurisdictionFilter = '全辖区' | '外高桥' | '洋山' | '吴淞' | '宝山';
const JURISDICTION_OPTIONS: JurisdictionFilter[] = ['全辖区', '外高桥', '洋山', '吴淞', '宝山'];

export default function RiskWarningRiskListTab({
  risks,
  selectedRiskId,
  onSelectRisk,
  onPlayback,
}: RiskWarningRiskListTabProps) {
  const [timeRange, setTimeRange] = useState('今天');
  const [jurisdictionFilter, setJurisdictionFilter] = useState<JurisdictionFilter>('全辖区');
  const [riskTypeFilter, setRiskTypeFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [levelFilter, setLevelFilter] = useState('全部');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const allRisks = useMemo(() => buildDisplayRisks(risks), [risks]);
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
      const matchesRiskType = riskTypeFilter === '全部' || item.risk === riskTypeFilter;
      const matchesStatus = statusFilter === '全部' || item.displayStatus === statusFilter;
      const matchesLevel = levelFilter === '全部' || level === levelFilter;
      return matchesSearch && matchesRiskType && matchesStatus && matchesLevel;
    });
  }, [allRisks, levelFilter, riskTypeFilter, search, statusFilter]);

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
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <FilterSelect
              icon={<Clock3 size={12} className="text-sky-500" />}
              value={timeRange}
              options={['今天', '近3天', '近7天', '自定义']}
              onChange={(value) => {
                setTimeRange(value);
                setCurrentPage(1);
              }}
            />
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-0.5">
              {JURISDICTION_OPTIONS.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setJurisdictionFilter(item);
                    setCurrentPage(1);
                  }}
                  className={`rounded-lg px-3 py-1 text-[10px] font-black transition-all ${
                    jurisdictionFilter === item
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <FilterSelect
              icon={<TriangleAlert size={12} className="text-violet-500" />}
              value={riskTypeFilter}
              options={riskTypeOptions}
              onChange={(value) => {
                setRiskTypeFilter(value);
                setCurrentPage(1);
              }}
            />
            <FilterSelect
              icon={<Siren size={12} className="text-emerald-500" />}
              value={statusFilter}
              options={['全部', '报警中', '已关闭']}
              onChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            />
            <FilterSelect
              icon={<ShieldAlert size={12} className="text-amber-500" />}
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
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="搜索船名/MMSI..."
                className="w-44 rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-[11px] text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500/60"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-sky-600">
              <FileSpreadsheet size={13} />
              导出
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">统计:</span>
            <span className="text-[10px] font-black text-slate-700">{filteredRisks.length} 条记录</span>
          </div>
          <div className="h-2.5 w-px bg-slate-200" />
          <div className="flex items-center gap-3">
            {(['紧急', '警报', '警告', '注意'] as const).map((lvl) => (
              <div key={lvl} className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${RISK_LEVEL_STYLES[lvl].dot}`} />
                <span className="text-[10px] text-slate-500">{lvl}</span>
                <span className={`text-[10px] font-bold ${RISK_LEVEL_STYLES[lvl].text}`}>{stats[lvl]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-6 py-3 text-center">触发时间</th>
                <th className="px-6 py-3">目标船舶</th>
                <th className="px-6 py-3">风险等级</th>
                <th className="px-6 py-3">发生区域</th>
                <th className="px-6 py-3">状态</th>
                <th className="px-6 py-3 text-right">操作</th>
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
                    className={`border-b border-slate-50 transition-colors hover:bg-slate-50 cursor-pointer ${
                      selected ? 'bg-sky-50/50' : ''
                    }`}
                    onClick={() => onSelectRisk(selected ? null : ship.id)}
                  >
                    <td className="px-6 py-4 text-center font-mono text-xs text-slate-400">
                      {ship.time}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${levelStyle.bg} ${levelStyle.text}`}>
                          <Ship size={14} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-700">
                            {ship.englishName}
                            <span className="ml-1.5 text-[10px] font-normal text-slate-400">{ship.risk}</span>
                          </div>
                          <div className="mt-0.5 font-mono text-[10px] text-slate-400">
                            {ship.mmsi} / {ship.type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-black ${levelStyle.border} ${levelStyle.bg} ${levelStyle.text}`}>
                        {level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{ship.snapshot.location}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLES[ship.displayStatus]}`} />
                        {ship.displayStatus}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onPlayback(ship);
                          }}
                          className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-1.5 text-[10px] font-bold text-sky-600 transition-all hover:bg-sky-100"
                        >
                          回放
                        </button>
                        <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-500 transition-all hover:bg-slate-50">
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

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 text-xs text-slate-400 bg-slate-50/30">
          <span>显示 {currentPageItems.length} 条，共 {filteredRisks.length} 条记录</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, safeCurrentPage - 1))}
              disabled={safeCurrentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white transition-all hover:bg-slate-50 disabled:opacity-30"
            >
              ‹
            </button>
            {pageNumbers.map((page, idx) =>
              typeof page === 'number' ? (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-1 text-[10px] font-black transition-all ${
                    page === safeCurrentPage
                      ? 'border-sky-500 bg-sky-500 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span key={idx} className="px-1 text-slate-300">
                  ...
                </span>
              ),
            )}
            <button
              onClick={() => setCurrentPage((page) => Math.min(totalPages, safeCurrentPage + 1))}
              disabled={safeCurrentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white transition-all hover:bg-slate-50 disabled:opacity-30"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
