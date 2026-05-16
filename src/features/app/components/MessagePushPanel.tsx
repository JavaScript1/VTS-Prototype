/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, AlertTriangle, CloudRain, X, Check, RotateCcw, Ban } from 'lucide-react';
import { type PushMessage } from '../../../types';

const MOCK_INTENTS = [
  { 
    title: '意图识别', 
    content: "识别到 'COSCO SHIPPING' 意图：靠泊 粮油码头 A1", 
    level: 'info',
    suggestion: '建议批准靠泊申请，并指派拖轮“沪港拖01”协助。',
    hasActions: true
  },
  { 
    title: '意图识别', 
    content: "识别到 'EVER GIVEN' 意图：通过 苏伊士运河", 
    level: 'info',
    suggestion: '建议保持当前航速，注意河道窄段。',
    hasActions: false
  },
  { 
    title: '意图识别', 
    content: "识别到 'MAERSK ALABAMA' 意图：前往 锚地 A2", 
    level: 'info',
    suggestion: '建议引导其进入 A2 锚地 3 号位。',
    hasActions: true
  },
];

const MOCK_WARNINGS = [
  { 
    title: '预警信息', 
    content: "预警：'SHIP A' 偏离航道 0.5nm", 
    level: 'warning',
    suggestion: '系统已发出修正指令，建议值班员持续观察。',
    hasActions: true
  },
  { 
    title: '碰撞风险', 
    content: "预警：'SHIP B' 与 'SHIP C' 存在碰撞风险 (CPA < 0.1nm)", 
    level: 'emergency',
    suggestion: '立即通过 VHF 呼叫双方避让。',
    hasActions: true
  },
  { 
    title: '进入禁区', 
    content: "警报：'SHIP D' 进入禁航区", 
    level: 'emergency',
    suggestion: '立即指派海巡船进行干预。',
    hasActions: true
  },
];

const MOCK_WEATHER = [
  { 
    title: '天气提醒', 
    content: "区域 A 预计 10 分钟后有强降雨", 
    level: 'info',
    suggestion: '建议周边船舶减速航行。',
    hasActions: false
  },
  { 
    title: '能见度提醒', 
    content: "港口能见度下降至 500m", 
    level: 'warning',
    suggestion: '建议启动大雾天气航行管制预案。',
    hasActions: true
  },
  { 
    title: '大风预警', 
    content: "阵风达到 7 级，请注意航行安全", 
    level: 'warning',
    suggestion: '建议锚泊船加强值班，防止走锚。',
    hasActions: false
  },
];

export default function MessagePushPanel() {
  const [messages, setMessages] = useState<PushMessage[]>([]);

  useEffect(() => {
    const addRandomMessage = () => {
      const types: ('intent' | 'warning' | 'weather')[] = ['intent', 'warning', 'weather'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      let source: any[];
      switch (type) {
        case 'intent': source = MOCK_INTENTS; break;
        case 'warning': source = MOCK_WARNINGS; break;
        case 'weather': source = MOCK_WEATHER; break;
      }
      
      const template = source[Math.floor(Math.random() * source.length)];
      const newMessage: PushMessage = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        title: template.title,
        content: template.content,
        level: template.level,
        suggestion: template.suggestion,
        hasActions: template.hasActions,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setMessages((prev) => [newMessage, ...prev].slice(0, 8));
    };

    // Initial message
    addRandomMessage();

    const interval = setInterval(addRandomMessage, 12000);
    return () => clearInterval(interval);
  }, []);

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'intent': return <Compass size={14} className="text-sky-400" />;
      case 'warning': return <AlertTriangle size={14} className="text-red-400" />;
      case 'weather': return <CloudRain size={14} className="text-teal-400" />;
      default: return null;
    }
  };

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'emergency': return 'border-red-500/50 bg-red-500/15 shadow-red-500/10';
      case 'warning': return 'border-orange-500/50 bg-orange-500/15 shadow-orange-500/10';
      default: return 'border-white/10 bg-white/10 shadow-black/20';
    }
  };

  return (
    <div className="absolute right-6 top-24 z-[1000] flex flex-col gap-2 w-[420px] pointer-events-none">
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            layout
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className={`pointer-events-auto relative overflow-hidden rounded-lg border backdrop-blur-xl shadow-2xl transition-all duration-300 ${getLevelColor(message.level)}`}
          >
            <div className="flex items-stretch min-h-[64px]">
              {/* Left Content Area */}
              <div className="flex-1 flex flex-col p-3 border-r border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="rounded-full bg-white/5 p-1">{getIcon(message.type)}</div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
                    {message.title}
                  </span>
                  <span className="text-[9px] font-medium text-white/30 tabular-nums ml-auto">
                    {message.time}
                  </span>
                </div>
                
                <p className="text-[11px] leading-tight font-bold text-white line-clamp-1 mb-1">
                  {message.content}
                </p>

                {message.suggestion && (
                  <p className="text-[10px] leading-tight text-sky-400/80 italic line-clamp-1">
                    建议：{message.suggestion}
                  </p>
                )}
              </div>

              {/* Right Action Area */}
              <div className="w-[80px] flex flex-col justify-start gap-1 p-1.5 bg-black/20">
                {message.hasActions ? (
                  <>
                    <button 
                      onClick={() => removeMessage(message.id)}
                      className="flex items-center justify-center h-6 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all hover:bg-emerald-500/30"
                    >
                      <Check size={12} className="mr-1" /> <span className="text-[9px] font-black">批准</span>
                    </button>
                    <button 
                      className="flex items-center justify-center h-6 rounded bg-amber-500/10 text-amber-400/80 border border-amber-500/20 transition-all hover:bg-amber-500/20"
                    >
                      <RotateCcw size={10} className="mr-1" /> <span className="text-[9px] font-black">重办</span>
                    </button>
                    <button 
                      onClick={() => removeMessage(message.id)}
                      className="flex items-center justify-center h-6 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all hover:bg-rose-500/30"
                    >
                      <Ban size={12} className="mr-1" /> <span className="text-[9px] font-black">拒绝</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => removeMessage(message.id)}
                    className="flex items-center justify-center h-6 rounded bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/40 border border-white/5 transition-all hover:bg-white/10"
                  >
                    忽略
                  </button>
                )}
              </div>

              {/* Close Button Overlay */}
              <button
                onClick={() => removeMessage(message.id)}
                className="absolute top-0.5 right-0.5 text-white/5 hover:text-white transition-colors p-0.5"
              >
                <X size={8} />
              </button>
            </div>
            
            {/* Dynamic progress bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: 0 }}
              transition={{ duration: 20, ease: 'linear' }}
              onAnimationComplete={() => removeMessage(message.id)}
              className={`h-0.5 absolute bottom-0 left-0 ${
                message.level === 'emergency' ? 'bg-red-500' : 
                message.level === 'warning' ? 'bg-orange-500' : 'bg-sky-500'
              }`}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
