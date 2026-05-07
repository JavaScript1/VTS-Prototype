import { Check, ChevronDown, ChevronRight, Map as MapIcon } from 'lucide-react';
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
};

export default function PlaybackAreaSelector({
  areasByCategory,
  selectedAreas,
  expandedCategories,
  onToggleArea,
  onToggleCategory,
  onToggleAllInCategory,
  onReset,
}: PlaybackAreaSelectorProps) {
  return (
    <div className="z-[10] flex w-64 flex-col border-r border-white/10 bg-black/40 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div className="flex items-center gap-2">
          <MapIcon size={16} className="text-sky-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            辖区管理面板
          </h3>
        </div>
        <span className="rounded bg-sky-500/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-sky-400/60">
          已选 {selectedAreas.size}
        </span>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {Object.entries(areasByCategory).map(([category, areas]) => {
            const isExpanded = expandedCategories.has(category);
            const allSelected = areas.every((area) => selectedAreas.has(area.id));
            const someSelected = areas.some((area) => selectedAreas.has(area.id)) && !allSelected;

            return (
              <div key={category} className="space-y-0.5">
                <div className="group flex items-center gap-2 rounded-lg p-2 transition-all hover:bg-white/5">
                  <button
                    onClick={() => onToggleCategory(category)}
                    className="rounded p-1 text-white/40 transition-all hover:bg-white/10"
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <div
                    onClick={() => onToggleAllInCategory(category, areas)}
                    className="flex flex-1 cursor-pointer items-center gap-2"
                  >
                    <div
                      className={`flex h-3.5 w-3.5 items-center justify-center rounded border transition-all ${
                        allSelected
                          ? 'border-sky-500 bg-sky-500'
                          : someSelected
                            ? 'border-sky-500/60 bg-sky-500/40'
                            : 'border-white/20'
                      }`}
                    >
                      {allSelected && <Check size={10} className="text-white" strokeWidth={4} />}
                      {someSelected && <div className="h-0.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-[12px] font-bold text-white/60 transition-colors group-hover:text-white">
                      {category}
                    </span>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="ml-6 space-y-0.5 overflow-hidden"
                    >
                      {areas.map((area) => (
                        <div
                          key={area.id}
                          onClick={() => onToggleArea(area.id)}
                          className="group flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-all hover:bg-white/5"
                        >
                          <div
                            className={`flex h-3.5 w-3.5 items-center justify-center rounded border transition-all ${
                              selectedAreas.has(area.id)
                                ? 'border-sky-500 bg-sky-500'
                                : 'border-white/20'
                            }`}
                          >
                            {selectedAreas.has(area.id) && (
                              <Check size={10} className="text-white" strokeWidth={4} />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span
                              className={`text-[12px] transition-colors ${
                                selectedAreas.has(area.id)
                                  ? 'font-bold text-white'
                                  : 'text-white/40 group-hover:text-white/60'
                              }`}
                            >
                              {area.name}
                            </span>
                            <span className="text-[10px] text-white/20">{area.type}</span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/10 bg-white/[0.02] p-4">
        <button
          onClick={onReset}
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 text-[11px] font-bold text-white/40 transition-all hover:bg-white/10 hover:text-white"
        >
          重置选择
        </button>
      </div>
    </div>
  );
}
