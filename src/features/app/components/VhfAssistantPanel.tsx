/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * VHF智能助理面板
 * 对应需求文档 1.1: VHF语音识别与意图理解
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radio, Mic, Volume2, ChevronDown, CheckCircle, 
  AlertTriangle, Zap, Globe, Send
} from 'lucide-react';
import { 
  MOCK_VHF_RECOGNITIONS, VHF_INTENT_CONFIG,
  type VhfRecognitionResult 
} from '../utils/dutyModeData';

export default function VhfAssistantPanel() {
  const [recognitions] = useState<VhfRecognitionResult[]>(MOCK_VHF_RECOGNITIONS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-sky-50 rounded-lg text-sky-600">
            <Radio size={16} />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            VHF智能助理
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-black text-emerald-600 border border-emerald-100">
          <Mic size={10} className="animate-pulse" />
          监听中
        </div>
      </div>

      {/* 频道状态 */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { ch: 'Ch14', label: '主频', active: true },
          { ch: 'Ch16', label: '遇险', active: true },
          { ch: 'Ch08', label: '辅助', active: false },
        ].map((channel) => (
          <div key={channel.ch} className={`rounded-lg border p-2 text-center ${
            channel.active ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50'
          }`}>
            <div className={`text-sm font-black ${channel.active ? 'text-emerald-600' : 'text-slate-400'}`}>
              {channel.ch}
            </div>
            <div className={`text-[8px] font-bold ${channel.active ? 'text-emerald-500' : 'text-slate-400'}`}>
              {channel.label}
              {channel.active && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            </div>
          </div>
        ))}
      </div>

      {/* 识别记录 */}
      <div className="space-y-2">
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
          语音识别记录
        </div>
        {recognitions.map((rec) => {
          const intentConfig = VHF_INTENT_CONFIG[rec.intent];
          const isExpanded = expandedId === rec.id;

          return (
            <motion.div
              key={rec.id}
              className={`rounded-xl border overflow-hidden ${
                rec.intent === 'emergency' ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100 bg-white'
              }`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                className="w-full text-left p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 p-1 rounded-md ${
                      rec.intent === 'emergency' ? 'bg-rose-100' : 'bg-sky-50'
                    }`}>
                      {rec.intent === 'emergency' ? (
                        <AlertTriangle size={10} className="text-rose-500" />
                      ) : (
                        <Volume2 size={10} className="text-sky-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-800">
                          {rec.vesselName || '未知船舶'}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black bg-${intentConfig.color}-50 text-${intentConfig.color}-600`}>
                          {intentConfig.label}
                        </span>
                        <span className="px-1 py-0.5 rounded text-[7px] font-bold bg-slate-100 text-slate-500">
                          {rec.language === 'zh' ? '中' : 'EN'}
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-500 mt-0.5 line-clamp-1">
                        {rec.rawTranscript}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] font-bold text-slate-400">{rec.timestamp}</span>
                    <ChevronDown size={12} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* 置信度和状态 */}
                <div className="flex items-center gap-3 mt-2 pl-7">
                  <span className="text-[8px] font-bold text-slate-400">AI识别:</span>
                  <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                    <div className="h-full rounded-full bg-sky-400" style={{ width: `${rec.confidence}%` }} />
                  </div>
                  <span className="text-[9px] font-black text-sky-600">{rec.confidence}%</span>
                  {rec.autoApproved && (
                    <span className="flex items-center gap-0.5 text-[8px] font-black text-emerald-600">
                      <CheckCircle size={8} />
                      已自动处理
                    </span>
                  )}
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
                      {/* 原始语音转文字 */}
                      <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                        <div className="text-[8px] font-black text-slate-500 mb-1">原始语音转文字</div>
                        <p className="text-[9px] font-bold text-slate-700 leading-relaxed italic">
                          "{rec.rawTranscript}"
                        </p>
                      </div>

                      {/* 提取参数 */}
                      <div className="rounded-lg bg-blue-50 border border-blue-100 p-2">
                        <div className="text-[8px] font-black text-blue-600 mb-1 flex items-center gap-1">
                          <Zap size={8} />
                          AI提取参数
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {Object.entries(rec.extractedParams).map(([key, value]) => (
                            <div key={key} className="text-[8px]">
                              <span className="font-bold text-blue-500">{key}: </span>
                              <span className="font-black text-blue-700">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 建议回复 */}
                      {rec.suggestedResponse && (
                        <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2">
                          <div className="text-[8px] font-black text-emerald-600 mb-1 flex items-center gap-1">
                            <Send size={8} />
                            AI建议回复
                          </div>
                          <p className="text-[9px] font-bold text-emerald-700 leading-relaxed">
                            {rec.suggestedResponse}
                          </p>
                        </div>
                      )}

                      {/* 操作按钮 */}
                      <div className="flex gap-2 pt-1">
                        {!rec.autoApproved && (
                          <button className="flex-1 py-1.5 rounded-lg bg-sky-500 text-white text-[9px] font-black text-center">
                            批准并回复
                          </button>
                        )}
                        <button className="flex-1 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[9px] font-black text-center">
                          人工处理
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
    </div>
  );
}
