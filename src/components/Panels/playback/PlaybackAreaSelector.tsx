import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { MockArea, MockAreaMap } from '../../../types';

type PlaybackAreaSelectorProps = {
  areasByCategory: MockAreaMap;
  selectedAreas: Set<string>;
  expandedCategories: Set<string>;
  onToggleArea: (areaId: string) => void;
  onToggleCategory: (category: string) => void;
  onToggleAllInCategory: (category: string, areas: MockArea[]) => void;
  onReset: () => void;
  embedded?: boolean;
};

export default function PlaybackAreaSelector({
  areasByCategory,
  selectedAreas,
  expandedCategories,
  onToggleArea,
  onToggleCategory,
  onToggleAllInCategory,
  onReset,
  embedded = false,
}: PlaybackAreaSelectorProps) {
  return (
    <div
      className={`rounded-2xl p-3 ${
        embedded ? 'border border-slate-200 bg-slate-50' : 'border border-white/5 bg-[#11161f]'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className={`text-[13px] font-bold ${embedded ? 'text-slate-800' : 'text-white/88'}`}>
          关联辖区
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] ${
              embedded ? 'bg-sky-100 text-sky-600' : 'bg-[#0c3751] text-[#18c4ff]'
            }`}
          >
            已选 {selectedAreas.size}
          </span>
          <button
            onClick={onReset}
            className={`rounded-md px-2 py-0.5 text-[11px] transition-all ${
              embedded
                ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                : 'bg-[#123243] text-[#18c4ff] hover:bg-[#18455b]'
            }`}
          >
            重置
          </button>
        </div>
      </div>

      <div className="custom-scrollbar max-h-[320px] overflow-y-auto pr-1">
        {Object.entries(areasByCategory).map(([category, areas]) => {
          const isExpanded = expandedCategories.has(category);
          const allSelected = areas.every((area) => selectedAreas.has(area.id));
          const someSelected = !allSelected && areas.some((area) => selectedAreas.has(area.id));

          return (
            <div key={category} className="mb-1">
              <div
                className={`flex items-center gap-2 rounded-lg px-2 py-2 text-[12px] ${
                  embedded
                    ? 'text-slate-600 hover:bg-white'
                    : 'text-white/70 hover:bg-white/[0.03]'
                }`}
              >
                <button
                  onClick={() => onToggleCategory(category)}
                  className={`rounded p-0.5 transition-all ${
                    embedded ? 'text-slate-400 hover:bg-slate-100' : 'text-white/45 hover:bg-white/[0.06]'
                  }`}
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                <button
                  onClick={() => onToggleAllInCategory(category, areas)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                      allSelected
                        ? 'border-[#18c4ff] bg-[#18c4ff]'
                        : someSelected
                          ? 'border-[#18c4ff] bg-[#18c4ff]/45'
                          : embedded
                            ? 'border-slate-300'
                            : 'border-white/18'
                    }`}
                  >
                    {allSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                    {someSelected && <span className="h-0.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <span>{category}</span>
                </button>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="ml-5 overflow-hidden"
                  >
                    {areas.map((area) => (
                      <button
                        key={area.id}
                        onClick={() => onToggleArea(area.id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[12px] ${
                          embedded ? 'hover:bg-white' : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        <span
                          className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                            selectedAreas.has(area.id)
                              ? 'border-[#18c4ff] bg-[#18c4ff]'
                              : embedded
                                ? 'border-slate-300'
                                : 'border-white/18'
                          }`}
                        >
                          {selectedAreas.has(area.id) && (
                            <Check size={10} className="text-white" strokeWidth={3} />
                          )}
                        </span>
                        <span
                          className={
                            selectedAreas.has(area.id)
                              ? embedded
                                ? 'text-slate-800'
                                : 'text-white'
                              : embedded
                                ? 'text-slate-400'
                                : 'text-white/48'
                          }
                        >
                          {area.name}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
