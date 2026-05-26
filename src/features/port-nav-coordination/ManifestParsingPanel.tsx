/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 数字化舱单多模态解析面板
 * 对应需求文档 2.1: 数字化舱单多模态解析与申报
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, CheckCircle, AlertCircle, Loader2, 
  ChevronDown, Upload, Zap, Eye
} from 'lucide-react';
import { MOCK_MANIFESTS, type ManifestItem, type ManifestStatus } from './portNavData';

const getStatusConfig = (status: ManifestStatus) => {
  switch (status) {
    case 'pending': return { label: '待解析', color: 'slate', icon: Upload };
    case 'parsing': return { label: '解析中', color: 'blue', icon: Loader2 };
    case 'parsed': return { label: '已解析', color: 'amber', icon: Eye };
    case 'verified': return { label: '已验证', color: 'emerald', icon: CheckCircle };
    case 'error': return { label: '解析失败', color: 'rose', icon: AlertCircle };
  }
};

const getSourceLabel = (source: string) => {
  switch (source) {
    case 'email': return '邮件附件';
    case 'fax': return '传真扫描';
    case 'pdf': return 'PDF文档';
    case 'api': return 'API对接';
    default: return source;
  }
};

export default function ManifestParsingPanel() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [manifests] = useState<ManifestItem[]>(MOCK_MANIFESTS);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-cyan-50 rounded-lg text-cyan-600">
            <FileText size={16} />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            数字化舱单智能解析
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-50 text-[10px] font-black text-cyan-600 border border-cyan-100">
          <Zap size={10} />
          多模态OCR+NLP
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
          <div className="text-lg font-black text-emerald-600">96.8%</div>
          <div className="text-[9px] font-bold text-emerald-500 mt-0.5">自动解析率</div>
        </div>
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
          <div className="text-lg font-black text-blue-600">4.2s</div>
          <div className="text-[9px] font-bold text-blue-500 mt-0.5">平均解析耗时</div>
        </div>
        <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 text-center">
          <div className="text-lg font-black text-violet-600">98.2%</div>
          <div className="text-[9px] font-bold text-violet-500 mt-0.5">字段准确率</div>
        </div>
      </div>

      {/* 舱单列表 */}
      <div className="space-y-3">
        {manifests.map((manifest) => {
          const config = getStatusConfig(manifest.status);
          const StatusIcon = config.icon;
          const isExpanded = expandedId === manifest.id;

          return (
            <motion.div
              key={manifest.id}
              layout
              className={`rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
                manifest.hazardousCargo ? 'border-rose-200' : 'border-slate-100'
              }`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : manifest.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-${config.color}-50 text-${config.color}-600`}>
                      <StatusIcon size={16} className={manifest.status === 'parsing' ? 'animate-spin' : ''} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{manifest.shipName}</span>
                        {manifest.hazardousCargo && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-rose-50 text-rose-600 border border-rose-100">
                            危险品
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {getSourceLabel(manifest.source)} · IMO: {manifest.imo}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-0.5 rounded-md text-[10px] font-black bg-${config.color}-50 text-${config.color}-600 border border-${config.color}-100`}>
                      {config.label}
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                <div className="mt-2 text-[10px] font-bold text-slate-500">
                  {manifest.cargoSummary}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && manifest.parsedFields.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-slate-50 pt-3">
                      <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
                        <Zap size={10} className="text-cyan-500" />
                        AI解析字段 (置信度: {manifest.confidence}%)
                      </div>
                      <div className="space-y-1.5">
                        {manifest.parsedFields.map((field, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-slate-400 w-16">{field.fieldName}</span>
                              <span className="text-[10px] font-black text-slate-700">{field.value}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                field.source === 'ocr' ? 'bg-blue-50 text-blue-500' : 
                                field.source === 'nlp' ? 'bg-violet-50 text-violet-500' : 
                                'bg-slate-100 text-slate-500'
                              }`}>
                                {field.source.toUpperCase()}
                              </span>
                              <div className={`w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden`}>
                                <div 
                                  className={`h-full rounded-full ${field.confidence > 95 ? 'bg-emerald-400' : field.confidence > 90 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                  style={{ width: `${field.confidence}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {manifest.parsedAt && (
                        <div className="text-[9px] font-bold text-slate-400 text-right">
                          解析完成: {manifest.parsedAt}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
