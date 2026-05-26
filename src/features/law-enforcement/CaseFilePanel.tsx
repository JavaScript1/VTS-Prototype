/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 智能卷宗生成面板
 * 对应需求文档 5.3: 智能卷宗生成
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, ChevronDown, Zap, CheckCircle, Clock,
  Download, Printer, Eye, BookOpen
} from 'lucide-react';
import { MOCK_CASE_FILES, type CaseFile } from './lawEnforcementData';

const getFileStatusConfig = (status: string) => {
  switch (status) {
    case 'draft': return { label: '草稿', color: 'slate' };
    case 'review': return { label: '审核中', color: 'amber' };
    case 'approved': return { label: '已批准', color: 'emerald' };
    case 'archived': return { label: '已归档', color: 'blue' };
    default: return { label: status, color: 'slate' };
  }
};

export default function CaseFilePanel() {
  const [caseFiles] = useState<CaseFile[]>(MOCK_CASE_FILES);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
            <BookOpen size={16} />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            智能卷宗生成
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-black text-emerald-600 border border-emerald-100">
          <Zap size={10} />
          AI生成
        </div>
      </div>

      {/* 统计 */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-100 p-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-lg font-black text-emerald-600">{caseFiles.length}</div>
            <div className="text-[8px] font-bold text-emerald-500">总卷宗</div>
          </div>
          <div>
            <div className="text-lg font-black text-blue-600">{Math.round(caseFiles.reduce((acc, f) => acc + f.aiGeneratedRatio, 0) / caseFiles.length)}%</div>
            <div className="text-[8px] font-bold text-blue-500">AI生成率</div>
          </div>
          <div>
            <div className="text-lg font-black text-slate-600">{caseFiles.reduce((acc, f) => acc + f.totalPages, 0)}</div>
            <div className="text-[8px] font-bold text-slate-500">总页数</div>
          </div>
        </div>
      </div>

      {/* 卷宗列表 */}
      <div className="space-y-2">
        {caseFiles.map((caseFile) => {
          const statusConfig = getFileStatusConfig(caseFile.status);
          const isExpanded = expandedId === caseFile.id;

          return (
            <motion.div
              key={caseFile.id}
              className="rounded-xl border border-slate-100 bg-white overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : caseFile.id)}
                className="w-full text-left p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-50 mt-0.5">
                      <FileText size={12} className="text-slate-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-800">{caseFile.title}</div>
                      <div className="flex items-center gap-3 mt-1 text-[8px] font-bold text-slate-400">
                        <span>{caseFile.totalPages}页</span>
                        <span>AI占比 {caseFile.aiGeneratedRatio}%</span>
                        <span>{caseFile.generatedAt.split(' ')[1]}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black bg-${statusConfig.color}-50 text-${statusConfig.color}-600`}>
                      {statusConfig.label}
                    </span>
                    <ChevronDown size={12} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2 border-t border-slate-100 pt-2">
                      {/* 章节列表 */}
                      <div className="space-y-1">
                        <div className="text-[9px] font-black text-slate-600">卷宗章节</div>
                        {caseFile.sections.map((section) => (
                          <div key={section.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2 border border-slate-100">
                            <div className="flex items-center gap-2">
                              {section.aiGenerated ? (
                                <Zap size={9} className="text-indigo-500" />
                              ) : (
                                <Clock size={9} className="text-amber-500" />
                              )}
                              <span className="text-[9px] font-bold text-slate-700">{section.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-bold text-slate-400">{section.pageCount}页</span>
                              {section.aiGenerated ? (
                                <span className="text-[7px] font-black text-indigo-500 bg-indigo-50 px-1 py-0.5 rounded">AI</span>
                              ) : (
                                <span className="text-[7px] font-black text-amber-500 bg-amber-50 px-1 py-0.5 rounded">人工</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 内容预览 */}
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <div className="text-[8px] font-black text-slate-500 mb-1">内容预览</div>
                        <pre className="text-[8px] font-mono text-slate-600 whitespace-pre-wrap leading-relaxed max-h-[100px] overflow-y-auto">
                          {caseFile.sections[0].content}
                        </pre>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-2 pt-1">
                        <button className="flex-1 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[9px] font-black flex items-center justify-center gap-1">
                          <Eye size={10} />
                          预览
                        </button>
                        <button className="flex-1 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[9px] font-black flex items-center justify-center gap-1">
                          <Download size={10} />
                          导出
                        </button>
                        <button className="flex-1 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[9px] font-black flex items-center justify-center gap-1">
                          <Printer size={10} />
                          打印
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* 生成新卷宗 */}
      <button className="w-full py-3 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
        <Zap size={12} />
        AI一键生成卷宗
      </button>
    </div>
  );
}
