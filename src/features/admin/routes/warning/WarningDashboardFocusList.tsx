import { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { buildPageNumbers } from './warningDashboardData';
import type { FocusListItem } from './warningDashboardData';

type WarningDashboardFocusListProps = {
  items: FocusListItem[];
};

export default function WarningDashboardFocusList({
  items,
}: WarningDashboardFocusListProps) {
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const pageNumbers = buildPageNumbers(currentPage, totalPages);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [currentPage, items, pageSize]);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/10">
        <div className="grid grid-cols-[2.2fr_1.3fr_1.2fr_1.8fr_120px] gap-4 border-b border-white/5 bg-white/[0.03] px-5 py-2 text-[11px] font-bold text-white/30 uppercase tracking-widest">
          <div>船舶名称</div>
          <div>船籍</div>
          <div>船舶类型</div>
          <div>高频预警类型</div>
          <div className="text-right">风险次数</div>
        </div>
        {paginatedItems.map((item) => (
          <div
            key={`${item.name}-${item.englishName}`}
            className="grid grid-cols-[2.2fr_1.3fr_1.2fr_1.8fr_120px] gap-4 border-b border-white/5 px-5 py-2.5 last:border-b-0 transition-colors hover:bg-white/[0.02]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#341724] text-[#ff4f86]">
                <BarChart3 size={14} />
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold text-white">
                  {item.name}
                  <span className="ml-2 text-[11px] font-medium text-white/40">({item.englishName})</span>
                </div>
                <div className="mt-0.5 truncate text-[10px] font-mono text-white/20">{item.ids}</div>
              </div>
            </div>
            <div className="flex items-center text-[12px] text-white/60">{item.flag}</div>
            <div className="flex items-center text-[12px] text-white/60">{item.shipType}</div>
            <div className="flex flex-wrap items-center gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded border px-2 py-0.5 text-[10px] ${
                    tag.startsWith('+')
                      ? 'border-[#005a8c] bg-[#032a41] text-[#18c4ff]'
                      : 'border-white/10 bg-white/[0.04] text-white/60'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-end text-[18px] font-black text-[#18c4ff]">
              {item.count}
              <span className="ml-1 text-[11px] font-bold opacity-30">次</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-4 px-5 text-[11px] text-white/30">
        <span>显示 {paginatedItems.length} 条，共 {items.length} 条记录</span>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={pageSize}
              onChange={(event) => {
                const nextPageSize = Number(event.target.value);
                setPageSize(nextPageSize);
                setCurrentPage(1);
              }}
              className="min-w-[82px] appearance-none rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 pr-7 text-[11px] text-white/60 focus:border-sky-500/40 focus:outline-none"
            >
              {[5, 10, 20].map((size) => (
                <option key={size} value={size} className="bg-[#101722]">
                  {size}条/页
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
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
                    page === currentPage
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
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.05] transition-all hover:bg-white/[0.1] disabled:opacity-30"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

