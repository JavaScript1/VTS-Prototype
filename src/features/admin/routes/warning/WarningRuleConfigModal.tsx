import { Check, ChevronDown, Search, Shield, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { MapContainer, Polygon, Polyline, TileLayer } from 'react-leaflet';
import type { WarningRule } from '../../../../mockData';
import { VTS_CHART_TILE_ATTRIBUTION, VTS_CHART_TILE_URL } from '../../../map/constants';
import type { WarningAreaFeature, WarningAreaRecord, RiskConfigAreaType } from './utils';

type WarningRuleConfigModalProps = {
  isOpen: boolean;
  selectedWarningRule: WarningRule | null;
  selectedRiskConfigAreaType: RiskConfigAreaType;
  warningAreaSearchQuery: string;
  allWarningAreas: WarningAreaRecord[];
  warningMapFeatures: WarningAreaFeature[];
  onClose: () => void;
  onReset: (ruleId: string) => void;
  onToggleRule: (ruleId: string) => void;
  onUpdateRule: (ruleId: string, updater: (rule: WarningRule) => WarningRule) => void;
  onSetRiskConfigAreaType: (value: RiskConfigAreaType) => void;
  onWarningAreaSearchQueryChange: (value: string) => void;
  onToggleWarningRuleArea: (ruleId: string, areaId: string) => void;
  onClearWarningRuleAreas: (ruleId: string) => void;
};

export default function WarningRuleConfigModal({
  isOpen,
  selectedWarningRule,
  selectedRiskConfigAreaType,
  warningAreaSearchQuery,
  allWarningAreas,
  warningMapFeatures,
  onClose,
  onReset,
  onToggleRule,
  onUpdateRule,
  onSetRiskConfigAreaType,
  onWarningAreaSearchQueryChange,
  onToggleWarningRuleArea,
  onClearWarningRuleAreas,
}: WarningRuleConfigModalProps) {
  if (!isOpen || !selectedWarningRule) return null;

  const descriptions =
    selectedWarningRule.descriptions && selectedWarningRule.descriptions.length > 0
      ? selectedWarningRule.descriptions
      : [selectedWarningRule.description];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-8 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="flex h-[min(860px,calc(100vh-64px))] w-[min(1100px,calc(100vw-96px))] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a1118] shadow-2xl"
        >
          <div className="shrink-0 border-b border-white/10 bg-white/[0.02] px-8 py-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10">
                  <Shield size={24} className="text-sky-400" />
                </div>
                <div>
                  <div className="text-xl font-bold tracking-tight text-white">规则策略配置</div>
                  <p className="mt-1 text-[13px] text-white/40">
                    自定义风险识别逻辑、预警响应等级以及地理生效范围
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onReset(selectedWarningRule.id)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-[12px] font-bold text-white/60 transition-all hover:bg-white/5 hover:text-white"
                >
                  恢复默认
                </button>
                <button
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/40 transition-all hover:bg-white/5 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="custom-scrollbar w-[300px] shrink-0 space-y-6 overflow-y-auto border-r border-white/10 bg-white/[0.01] px-5 py-6">
              <section className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">基础属性</span>
                </div>

                <div className="space-y-3">
                  <label className="block space-y-1.5">
                    <span className="ml-1 text-[10px] font-bold text-white/30">设置名称</span>
                    <input
                      type="text"
                      value={selectedWarningRule.name}
                      onChange={(event) =>
                        onUpdateRule(selectedWarningRule.id, (rule) => ({
                          ...rule,
                          name: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] text-white transition-all focus:border-sky-500/50 focus:outline-none"
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="ml-1 text-[10px] font-bold text-white/30">预警类型</span>
                    <div className="relative">
                      <select
                        value={selectedWarningRule.category}
                        onChange={(event) =>
                          onUpdateRule(selectedWarningRule.id, (rule) => ({
                            ...rule,
                            category: event.target.value as WarningRule['category'],
                          }))
                        }
                        className="w-full appearance-none rounded-lg border border-white/10 bg-[#121b26] px-3 py-2 text-[12px] text-white focus:border-sky-500/50 focus:outline-none"
                      >
                        {['单船风险', '多船风险', '船与环境风险', '碰撞风险'].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/20" />
                    </div>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="ml-1 text-[10px] font-bold text-white/30">预警等级</span>
                    <div className="relative">
                      <select
                        value={selectedWarningRule.severity}
                        onChange={(event) =>
                          onUpdateRule(selectedWarningRule.id, (rule) => ({
                            ...rule,
                            severity: event.target.value as WarningRule['severity'],
                          }))
                        }
                        className="w-full appearance-none rounded-lg border border-white/10 bg-[#121b26] px-3 py-2 text-[12px] text-white focus:border-sky-500/50 focus:outline-none"
                      >
                        {['注意', '警告', '警报', '紧急'].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/20" />
                    </div>
                  </label>

                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                    <div className="text-[12px] font-bold text-white">激活状态</div>
                    <button
                      onClick={() => onToggleRule(selectedWarningRule.id)}
                      className={`relative h-5 w-9 rounded-full transition-all ${
                        selectedWarningRule.enabled
                          ? 'bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                          : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                          selectedWarningRule.enabled ? 'left-[20px]' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-3 border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">规则描述逻辑</span>
                    </div>
                    <div className="space-y-2">
                      {descriptions.map((desc, index) => (
                        <textarea
                          key={`${selectedWarningRule.id}-${index}`}
                          value={desc}
                          onChange={(event) => {
                            const next = [...descriptions];
                            next[index] = event.target.value;
                            onUpdateRule(selectedWarningRule.id, (rule) => ({
                              ...rule,
                              descriptions: next,
                              description: next[0] || '',
                            }));
                          }}
                          rows={2}
                          className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-[12px] leading-relaxed text-white transition-all focus:border-sky-500/50 focus:outline-none"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="flex w-[300px] shrink-0 flex-col border-r border-white/10 bg-black/10">
              <div className="space-y-4 border-b border-white/10 bg-white/[0.01] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">选择生效区域</span>
                  <div className="font-mono text-[10px] font-black text-sky-400">
                    {selectedWarningRule.effectiveAreaIds.length} 选
                  </div>
                </div>
                <div className="group relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 transition-colors group-focus-within:text-sky-400" />
                  <input
                    type="text"
                    placeholder="搜索区域名称"
                    value={warningAreaSearchQuery}
                    onChange={(event) => onWarningAreaSearchQueryChange(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-9 pr-3 text-[12px] text-white transition-all focus:border-sky-500/50 focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {(['全部', '航道', '锚地', '泊位', '警戒区'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => onSetRiskConfigAreaType(type as RiskConfigAreaType)}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                        selectedRiskConfigAreaType === type
                          ? 'bg-white text-black'
                          : 'text-white/40 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-4">
                {allWarningAreas.map((area) => {
                  const isSelected = selectedWarningRule.effectiveAreaIds.includes(area.id);
                  return (
                    <button
                      key={area.id}
                      onClick={() => onToggleWarningRuleArea(selectedWarningRule.id, area.id)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 transition-all ${
                        isSelected
                          ? 'border-sky-500/30 bg-sky-500/10'
                          : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className={`truncate text-[11px] font-bold ${isSelected ? 'text-sky-300' : 'text-white/60'}`}>
                          {area.name}
                        </div>
                        <div className="mt-0.5 text-[10px] text-white/20">{area.type}</div>
                      </div>
                      {isSelected && <Check size={10} className="ml-1.5 text-sky-400" strokeWidth={4} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative flex-1 bg-black/40">
              <MapContainer
                center={[31.43, 121.5]}
                zoom={11}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={false}
                preferCanvas
              >
                <TileLayer url={VTS_CHART_TILE_URL} attribution={VTS_CHART_TILE_ATTRIBUTION} />
                {warningMapFeatures.map((feature) => {
                  const checked = selectedWarningRule.effectiveAreaIds.includes(feature.id);
                  const pathOptions = feature.polyline
                    ? {
                        color: checked ? '#38bdf8' : feature.color,
                        weight: checked ? 5 : 2,
                        opacity: checked ? 0.98 : 0.4,
                      }
                    : {
                        color: checked ? '#38bdf8' : feature.color,
                        weight: 1.5,
                        fillColor: checked ? '#0ea5e9' : feature.color,
                        fillOpacity: checked ? 0.4 : 0.1,
                        opacity: checked ? 0.95 : 0.3,
                      };

                  if (feature.polyline) {
                    return (
                      <Polyline
                        key={feature.id}
                        positions={feature.polyline}
                        pathOptions={pathOptions}
                        eventHandlers={{
                          click: () => onToggleWarningRuleArea(selectedWarningRule.id, feature.id),
                        }}
                      />
                    );
                  }

                  return (
                    <Polygon
                      key={feature.id}
                      positions={feature.polygon || []}
                      pathOptions={pathOptions}
                      eventHandlers={{
                        click: () => onToggleWarningRuleArea(selectedWarningRule.id, feature.id),
                      }}
                    />
                  );
                })}
              </MapContainer>

              <div className="pointer-events-none absolute right-4 top-4 z-[1000]">
                <div className="rounded-xl border border-white/10 bg-black/60 p-3 text-[11px] font-bold text-white/60 backdrop-blur-md">
                  点击地图区域图形可快速勾选
                </div>
              </div>

              <div className="absolute bottom-4 left-4 z-[1000] flex gap-2">
                <button
                  onClick={() => onClearWarningRuleAreas(selectedWarningRule.id)}
                  className="rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-[11px] font-bold text-white/60 backdrop-blur-md transition-all hover:text-white"
                >
                  清空全部区域
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 border-t border-white/10 bg-white/[0.02] px-8 py-5">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-[13px] font-bold text-white/40 transition-all hover:text-white"
            >
              取消
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-sky-500 px-10 py-2.5 text-[13px] font-black text-white shadow-2xl shadow-sky-500/20 transition-all hover:bg-sky-400"
            >
              应用并保存配置
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
