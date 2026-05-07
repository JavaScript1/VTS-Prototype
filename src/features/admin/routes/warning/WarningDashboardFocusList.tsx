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
        <div className="grid grid-cols-[2.2fr_1.3fr_1.2fr_1.8fr_120px] gap-4 border-b border-white/5 bg-white/[0.03] px-5 py-4 text-[12px] font-bold text-white/36">
          <div>船舶名称</div>
          <div>船籍</div>
          <div>船舶类型</div>
          <div>高频预警类型</div>
          <div className="text-right">风险次数</div>
        </div>
        {paginatedItems.map((item) => (
          <div
            key={`${item.name}-${item.englishName}`}
            className="grid grid-cols-[2.2fr_1.3fr_1.2fr_1.8fr_120px] gap-4 border-b border-white/5 px-5 py-4 last:border-b-0"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#341724] text-[#ff4f86]">
                <BarChart3 size={16} />
              </div>
              <div>
                <div className="text-[15px] font-bold text-white">
                  {item.name}
                  <span className="ml-2 text-[14px] text-white/72">({item.englishName})</span>
                </div>
                <div className="mt-1 text-[12px] text-white/24">{item.ids}</div>
              </div>
            </div>
            <div className="flex items-center text-[14px] text-white/75">{item.flag}</div>
            <div className="flex items-center text-[14px] text-white/75">{item.shipType}</div>
            <div className="flex flex-wrap items-center gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded-lg border px-3 py-1 text-[12px] ${
                    tag.startsWith('+')
                      ? 'border-[#005a8c] bg-[#032a41] text-[#18c4ff]'
                      : 'border-white/10 bg-white/[0.04] text-white/72'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-end text-[24px] font-black text-[#18c4ff]">
              {item.count}
              <span className="ml-1 text-[14px]">次</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-4 px-5 text-[12px] text-white/40">
        <span>共 {items.length} 条记录</span>
        <div className="flex items-center gap-3">
          <span className="text-white/60">共 {items.length} 条</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={(event) => {
                const nextPageSize = Number(event.target.value);
                setPageSize(nextPageSize);
                setCurrentPage(1);
              }}
              className="min-w-[92px] appearance-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 pr-8 text-[12px] text-white/80 focus:border-sky-500/40 focus:outline-none"
            >
              {[5, 10, 20].map((size) => (
                <option key={size} value={size} className="bg-[#101722]">
                  {size}条/页
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
              ˅
            </span>
          </div>
          <button
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="flex h-7 w-7 items-center justify-center rounded bg-white/[0.06] text-white/35 transition-all hover:bg-white/[0.1] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            ‹
          </button>
          {pageNumbers.map((page) =>
            typeof page === 'number' ? (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex h-7 min-w-7 items-center justify-center rounded px-2 text-[12px] font-bold transition-all ${
                  page === currentPage
                    ? 'bg-[#167dff] text-white'
                    : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white'
                }`}
              >
                {page}
              </button>
            ) : (
              <span key={page} className="px-1 text-white/30">
                ...
              </span>
            ),
          )}
          <button
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
            className="flex h-7 w-7 items-center justify-center rounded bg-white/[0.06] text-white/35 transition-all hover:bg-white/[0.1] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            ›
          </button>
        </div>
      </div>
    </>
  );
}
