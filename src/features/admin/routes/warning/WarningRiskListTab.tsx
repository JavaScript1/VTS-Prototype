import { Clock3, FileSpreadsheet, MapPin, Search, ShieldAlert, Ship, Siren, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { MockRiskStat } from '../../../../types';
import { getRiskLevel } from './utils';
import { buildDisplayRisks, buildPageNumbers, PAGE_SIZE, type DisplayRiskRow, type RiskStatusType } from './warningRiskListData';

type WarningRiskListTabProps = {
  risks: MockRiskStat[];
  selectedRiskId: string | null;
  onSelectRisk: (riskId: string | null) => void;
  onPlayback: (item: MockRiskStat) => void;
};

const LEVEL_STYLES: Record<string, string> = {
  紧急: 'border-[#7f1d1d] bg-[#3b1114] text-[#ff7b9c]',
  警报: 'border-[#6b2d1a] bg-[#3c1d15] text-[#ff7a4d]',
  警告: 'border-[#5e4b19] bg-[#3b3114] text-[#f6c343]',
  注意: 'border-[#124a6c] bg-[#0d2d42] text-[#4cc6ff]',
};

const STATUS_STYLES: Record<RiskStatusType, string> = {
  报警中: 'bg-[#ff4f86]',
  已关闭: 'bg-[#1ee6a0]',
};

function FilterSelect({
  icon,
  value,
  options,
  onChange,
}: {
  icon: React.ReactNode;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex min-w-[88px] items-center gap-2 rounded-xl border border-white/8 bg-[#111823] px-3 py-2 text-[12px] text-white/72">
      <span className="shrink-0">{icon}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 cursor-pointer bg-transparent text-[12px] text-white/80 outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#101722] text-white">
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

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

  const totalPages = Math.max(1, Math.ceil(filteredRisks.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const currentPageItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredRisks.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRisks, safeCurrentPage]);
  const pageNumbers = buildPageNumbers(safeCurrentPage, totalPages);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/6 bg-[#111822] px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
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
              icon={<TriangleAlert size={12} className="text-[#ff6ca5]" />}
              value={falsePositiveFilter}
              options={['全部', '是', '否']}
              onChange={(value) => {
                setFalsePositiveFilter(value);
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
                size={13}
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
                className="w-52 rounded-xl border border-white/8 bg-[#111823] py-2 pl-9 pr-4 text-[12px] text-white/78 outline-none transition-all placeholder:text-white/22 focus:border-[#167dff]/60"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-[#18bfff] px-4 py-2 text-[12px] font-bold text-white shadow-[0_8px_24px_rgba(24,191,255,0.22)] transition-all hover:bg-[#35c8ff]">
              <FileSpreadsheet size={14} />
              导出报表
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[22px] border border-[#1a2733] bg-[#121821] shadow-[0_18px_40px_rgba(0,0,0,0.26)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px] border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-[#1a212d] text-[12px] font-bold text-white/32">
                <th className="px-6 py-4 text-center">触发时间</th>
                <th className="px-6 py-4 text-left">目标船舶</th>
                <th className="px-6 py-4 text-left">船舶类型</th>
                <th className="px-6 py-4 text-left">是否误报</th>
                <th className="px-6 py-4 text-left">风险等级</th>
                <th className="px-6 py-4 text-left">发生区域</th>
                <th className="px-6 py-4 text-left">状态</th>
                <th className="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {currentPageItems.map((ship) => {
                const level = getRiskLevel(ship.riskScore);
                const selected = selectedRiskId === ship.id;
                return (
                  <tr
                    key={ship.id}
                    className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${
                      selected ? 'bg-[#182230]' : ''
                    }`}
                    onClick={() => onSelectRisk(selected ? null : ship.id)}
                  >
                    <td className="px-6 py-4 text-center font-mono text-[15px] text-white/46">
                      {ship.time}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#381524] text-[#ff4f86]">
                          <Ship size={14} />
                        </div>
                        <div>
                          <div className="text-[14px] text-white">
                            {ship.englishName}
                            <span className="text-white/74">（{ship.risk}）</span>
                          </div>
                          <div className="mt-1 font-mono text-[12px] text-white/28">
                            {ship.mmsi} / {ship.callsign || '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1 text-[12px] text-white/72">
                        {ship.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-md border border-[#0b6e58] bg-[#063d34] px-3 py-1 text-[12px] font-bold text-[#1ae6a3]">
                        {ship.falsePositive}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-md border px-3 py-1 text-[12px] font-bold ${LEVEL_STYLES[level]}`}>
                        {level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[14px] text-white/42">{ship.snapshot.location}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[14px] text-white/84">
                        <span className={`h-2 w-2 rounded-full ${STATUS_STYLES[ship.displayStatus]}`} />
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
                          className="rounded-md border border-[#0a537d] bg-[#083652] px-3 py-1 text-[12px] text-[#18c4ff] transition-all hover:border-[#18c4ff] hover:bg-[#0d476b]"
                        >
                          回放
                        </button>
                        <button className="rounded-md border border-[#6a2947] bg-[#341726] px-3 py-1 text-[12px] text-[#ff6ca5] transition-all hover:bg-[#452033]">
                          无效
                        </button>
                        <button className="rounded-md border border-[#0d7158] bg-[#074235] px-3 py-1 text-[12px] text-[#1ae6a3] transition-all hover:bg-[#0a5443]">
                          有效
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 text-[13px] text-white/32">
          <span>共 {filteredRisks.length} 条风险预警记录</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, safeCurrentPage - 1))}
              disabled={safeCurrentPage === 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.05] text-white/35 transition-all hover:bg-white/[0.1] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹
            </button>
            {pageNumbers.map((page) =>
              typeof page === 'number' ? (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-[12px] font-bold transition-all ${
                    page === safeCurrentPage
                      ? 'bg-[#167dff] text-white'
                      : 'bg-white/[0.05] text-white/55 hover:bg-white/[0.1] hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span key={page} className="px-1 text-white/24">
                  ...
                </span>
              ),
            )}
            <button
              onClick={() => setCurrentPage((page) => Math.min(totalPages, safeCurrentPage + 1))}
              disabled={safeCurrentPage === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.05] text-white/35 transition-all hover:bg-white/[0.1] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
