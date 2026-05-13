import { useState, useMemo } from 'react';
import { Search, Plus, Settings, X, Shield, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface VesselSymbol {
  id: string;
  name: string;
  code: string;
  category: string;
  color: string;
  haloColor: string;
  bodyColor: string;
  bridgeColor: string;
  trailColor: string;
  size: number;
  enabled: boolean;
  updatedAt: string;
}

const MOCK_SYMBOLS: VesselSymbol[] = [
  { 
    id: '1', name: '大型散货船', code: 'VTS_SYM_001', category: '货船', 
    color: '#22c55e', haloColor: 'rgba(34, 197, 94, 0.26)', bodyColor: '#22c55e', 
    bridgeColor: 'rgba(236, 253, 245, 0.8)', trailColor: 'rgba(220, 252, 231, 0.78)',
    size: 30, enabled: true, updatedAt: '2024-05-12 14:20' 
  },
  { 
    id: '2', name: '超大型油轮 (VLCC)', code: 'VTS_SYM_002', category: '货船', 
    color: '#ef4444', haloColor: 'rgba(239, 68, 68, 0.26)', bodyColor: '#ef4444', 
    bridgeColor: 'rgba(254, 242, 242, 0.8)', trailColor: 'rgba(254, 226, 226, 0.78)',
    size: 36, enabled: true, updatedAt: '2024-05-11 10:45' 
  },
  { 
    id: '3', name: '公务执法船', code: 'VTS_SYM_003', category: '公务船', 
    color: '#3b82f6', haloColor: 'rgba(59, 130, 246, 0.26)', bodyColor: '#3b82f6', 
    bridgeColor: 'rgba(239, 246, 255, 0.8)', trailColor: 'rgba(219, 234, 254, 0.78)',
    size: 28, enabled: true, updatedAt: '2024-05-12 09:15' 
  },
  { 
    id: '4', name: '危险品船 (LNG)', code: 'VTS_SYM_004', category: '特种船', 
    color: '#f59e0b', haloColor: 'rgba(245, 158, 11, 0.26)', bodyColor: '#f59e0b', 
    bridgeColor: 'rgba(255, 251, 235, 0.8)', trailColor: 'rgba(254, 243, 199, 0.78)',
    size: 34, enabled: true, updatedAt: '2024-05-10 16:30' 
  },
  { 
    id: '5', name: '近海拖网渔船', code: 'VTS_SYM_005', category: '渔船', 
    color: '#8b5cf6', haloColor: 'rgba(139, 92, 246, 0.26)', bodyColor: '#8b5cf6', 
    bridgeColor: 'rgba(245, 243, 255, 0.8)', trailColor: 'rgba(237, 233, 254, 0.78)',
    size: 24, enabled: false, updatedAt: '2024-05-09 11:20' 
  },
];

export default function VesselSymbolConfigRoute() {
  const [symbols, setSymbols] = useState(MOCK_SYMBOLS);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSymbol, setEditingSymbol] = useState<VesselSymbol | null>(null);

  const filteredSymbols = useMemo(() => {
    return symbols.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, symbols]);

  const handleToggle = (id: string) => {
    setSymbols(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleSave = (updated: VesselSymbol) => {
    setSymbols(prev => prev.map(s => s.id === updated.id ? updated : s));
    setEditingSymbol(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-4 w-1 rounded-full bg-sky-500" />
            <h3 className="whitespace-nowrap text-xs font-black uppercase tracking-widest text-white/90">
              船舶符号图例库配置
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/20">符号总数</span>
              <span className="text-[12px] font-mono font-black text-sky-400">{symbols.length}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              placeholder="搜索符号名称、代码..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-[11px] text-white focus:border-sky-500/50 focus:outline-none transition-all"
            />
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-[11px] font-black text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 transition-all">
            <Plus size={14} /> 新增符号
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/5 bg-[#0a101a] shadow-2xl">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">序号</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">预览</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">名称</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">符号代码</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">船型分类</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">修改时间</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">状态</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-right text-white/30">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredSymbols.map((symbol, index) => (
              <tr key={symbol.id} className="group transition-colors hover:bg-white/5">
                <td className="px-6 py-5 text-[11px] font-mono text-white/20">{(index + 1).toString().padStart(2, '0')}</td>
                <td className="px-6 py-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/40 border border-white/5">
                    <div className="ship-marker scale-75" style={{ '--ship-rotation': '45deg', width: '30px', height: '30px', position: 'relative' } as any}>
                      <div className="ship-marker__halo" style={{ background: `radial-gradient(circle, ${symbol.haloColor}, transparent 72%)`, position: 'absolute', inset: '6px' }}></div>
                      <div className="ship-marker__body" style={{ background: `linear-gradient(90deg, ${symbol.bodyColor} 0%, ${symbol.color} 100%)`, width: '20px', height: '10px', position: 'absolute', top: '9px', left: '5px' }}>
                        <span className="ship-marker__bridge" style={{ backgroundColor: symbol.bridgeColor, position: 'absolute', top: '2px', left: '4px', width: '5px', height: '5px' }}></span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-[12px] font-bold text-white/90">{symbol.name}</span>
                </td>
                <td className="px-6 py-5">
                  <span className="text-[10px] font-mono text-white/40">{symbol.code}</span>
                </td>
                <td className="px-6 py-5">
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/60">
                    {symbol.category}
                  </span>
                </td>
                <td className="px-6 py-5 text-[11px] font-mono text-white/30">{symbol.updatedAt}</td>
                <td className="px-6 py-5">
                  <button
                    onClick={() => handleToggle(symbol.id)}
                    className={`relative h-5 w-10 rounded-full transition-all duration-300 ${
                      symbol.enabled ? 'bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.4)]' : 'bg-white/10'
                    }`}
                  >
                    <div className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all duration-300 ${symbol.enabled ? 'left-6' : 'left-1'}`} />
                  </button>
                </td>
                <td className="px-6 py-5 text-right">
                  <button 
                    onClick={() => setEditingSymbol(symbol)}
                    className="rounded-lg p-2 text-white/40 transition-all hover:bg-sky-500/20 hover:text-sky-400"
                  >
                    <Settings size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence mode="wait">
        {editingSymbol && (
          <SymbolEditModal 
            symbol={editingSymbol} 
            onClose={() => setEditingSymbol(null)} 
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SymbolEditModal({ 
  symbol, 
  onClose, 
  onSave 
}: { 
  symbol: VesselSymbol; 
  onClose: () => void; 
  onSave: (updated: VesselSymbol) => void;
}) {
  const [formData, setFormData] = useState({ ...symbol });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[7000] flex items-center justify-center bg-black/60 p-8 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="flex h-[min(800px,calc(100vh-64px))] w-[min(1000px,calc(100vw-96px))] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a1118] shadow-2xl"
      >
        <div className="shrink-0 border-b border-white/10 bg-white/[0.02] px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10">
                <Shield size={24} className="text-sky-400" />
              </div>
              <div>
                <div className="text-xl font-bold tracking-tight text-white">编辑船舶符号</div>
                <p className="mt-1 text-[13px] text-white/40">自定义符号的外观属性、颜色参数及展示逻辑</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/40 transition-all hover:bg-white/5 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Form */}
          <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto px-10 py-8">
            <section className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">基本信息</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <label className="block space-y-1.5">
                  <span className="ml-1 text-[10px] font-bold text-white/30 uppercase">符号名称</span>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] text-white transition-all focus:border-sky-500/50 focus:outline-none"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="ml-1 text-[10px] font-bold text-white/30 uppercase">符号代码</span>
                  <input
                    type="text"
                    value={formData.code}
                    disabled
                    className="w-full rounded-lg border border-white/10 bg-white/[0.01] px-3 py-2 text-[12px] text-white/20 cursor-not-allowed"
                  />
                </label>
                <label className="block space-y-1.5 col-span-2">
                  <span className="ml-1 text-[10px] font-bold text-white/30 uppercase">船型分类</span>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full appearance-none rounded-lg border border-white/10 bg-[#121b26] px-3 py-2 text-[12px] text-white focus:border-sky-500/50 focus:outline-none"
                  >
                    {['货船', '客船', '公务船', '渔船', '工程船', '特种船'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>
              </div>
            </section>

            <section className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">样式配置</span>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <span className="ml-1 text-[10px] font-bold text-white/30 uppercase">符号大小 (PX)</span>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" min="10" max="60" 
                      value={formData.size}
                      onChange={e => setFormData({ ...formData, size: parseInt(e.target.value) })}
                      className="flex-1 accent-sky-500"
                    />
                    <span className="w-12 text-right font-mono text-[12px] font-bold text-sky-400">{formData.size}PX</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <span className="ml-1 text-[10px] font-bold text-white/30 uppercase">船体主色</span>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={formData.bodyColor} 
                        onChange={e => setFormData({ ...formData, bodyColor: e.target.value, color: e.target.value })}
                        className="h-9 w-12 shrink-0 rounded border border-white/10 bg-transparent p-1"
                      />
                      <input 
                        type="text" 
                        value={formData.bodyColor.toUpperCase()}
                        onChange={e => setFormData({ ...formData, bodyColor: e.target.value, color: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 text-[11px] font-mono text-white/60 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="ml-1 text-[10px] font-bold text-white/30 uppercase">光晕颜色</span>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={formData.haloColor} 
                        onChange={e => setFormData({ ...formData, haloColor: e.target.value })}
                        className="h-9 w-12 shrink-0 rounded border border-white/10 bg-transparent p-1"
                      />
                      <input 
                        type="text" 
                        value={formData.haloColor.toUpperCase()}
                        onChange={e => setFormData({ ...formData, haloColor: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 text-[11px] font-mono text-white/60 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-white">激活状态</span>
                    <span className="text-[10px] text-white/20">启用后该符号将在地图上对关联船型生效</span>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                    className={`relative h-6 w-11 rounded-full transition-all ${
                      formData.enabled ? 'bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.3)]' : 'bg-white/10'
                    }`}
                  >
                    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${formData.enabled ? 'left-[22px]' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Right: Preview */}
          <div className="relative flex w-[400px] flex-col border-l border-white/10 bg-black/40">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-6 py-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">实时渲染预览</span>
              <button className="text-white/20 hover:text-white transition-colors"><RotateCcw size={14} /></button>
            </div>
            
            <div className="flex flex-1 items-center justify-center p-12">
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="relative scale-[3.5] transform-gpu">
                <div className="ship-marker" style={{ '--ship-rotation': '45deg', width: '30px', height: '30px', position: 'relative' } as any}>
                  <div className="ship-marker__halo" style={{ background: `radial-gradient(circle, ${formData.haloColor}, transparent 72%)`, position: 'absolute', inset: '6px' }}></div>
                  <div className="ship-marker__body" style={{ background: `linear-gradient(90deg, ${formData.bodyColor} 0%, ${formData.color} 100%)`, width: '20px', height: '10px', position: 'absolute', top: '9px', left: '5px' }}>
                    <span className="ship-marker__bridge" style={{ backgroundColor: formData.bridgeColor, position: 'absolute', top: '2px', left: '4px', width: '5px', height: '5px' }}></span>
                  </div>
                  <div className="ship-marker__trail" style={{ backgroundColor: formData.trailColor, position: 'absolute', top: '13px', left: '1px', width: '7px', height: '2px' }}></div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 bg-white/[0.01] p-6">
              <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-3">
                <div className="flex items-start gap-2">
                  <Shield size={14} className="mt-0.5 text-sky-400" />
                  <p className="text-[11px] leading-relaxed text-sky-300/80">
                    符号预览使用系统核心渲染器，支持高 DPI 显示与亚像素级抗锯齿，确保在各种缩放级别下的一致性。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 border-t border-white/10 bg-white/[0.02] px-8 py-5">
          <button onClick={onClose} className="px-6 py-2.5 text-[13px] font-bold text-white/40 transition-all hover:text-white">取消</button>
          <button 
            onClick={() => onSave(formData)}
            className="rounded-xl bg-sky-500 px-10 py-2.5 text-[13px] font-black text-white shadow-2xl shadow-sky-500/20 transition-all hover:bg-sky-400"
          >
            保存并应用
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
