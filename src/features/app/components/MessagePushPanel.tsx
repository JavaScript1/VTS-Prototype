/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, AlertTriangle, CloudRain, X } from 'lucide-react';
import { type PushMessage } from '../../../types';

const MOCK_INTENTS = [
  { title: '意图识别', content: "识别到 'COSCO SHIPPING' 意图：靠泊 粮油码头 A1", level: 'info' },
  { title: '意图识别', content: "识别到 'EVER GIVEN' 意图：通过 苏伊士运河", level: 'info' },
  { title: '意图识别', content: "识别到 'MAERSK ALABAMA' 意图：前往 锚地 A2", level: 'info' },
];

const MOCK_WARNINGS = [
  { title: '预警信息', content: "预警：'SHIP A' 偏离航道 0.5nm", level: 'warning' },
  { title: '碰撞风险', content: "预警：'SHIP B' 与 'SHIP C' 存在碰撞风险 (CPA < 0.1nm)", level: 'emergency' },
  { title: '进入禁区', content: "警报：'SHIP D' 进入禁航区", level: 'emergency' },
];

const MOCK_WEATHER = [
  { title: '天气提醒', content: "区域 A 预计 10 分钟后有强降雨", level: 'info' },
  { title: '能见度提醒', content: "港口能见度下降至 500m", level: 'warning' },
  { title: '大风预警', content: "阵风达到 7 级，请注意航行安全", level: 'warning' },
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
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setMessages((prev) => [newMessage, ...prev].slice(0, 5));
    };

    // Initial message
    addRandomMessage();

    const interval = setInterval(addRandomMessage, 8000);
    return () => clearInterval(interval);
  }, []);

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'intent': return <Compass size={16} className="text-sky-400" />;
      case 'warning': return <AlertTriangle size={16} className="text-red-400" />;
      case 'weather': return <CloudRain size={16} className="text-teal-400" />;
      default: return null;
    }
  };

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'emergency': return 'border-red-500/50 bg-red-500/10';
      case 'warning': return 'border-orange-500/50 bg-orange-500/10';
      default: return 'border-white/10 bg-white/5';
    }
  };

  return (
    <div className="absolute right-6 top-24 z-[1000] flex flex-col gap-3 w-80 pointer-events-none">
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className={`pointer-events-auto relative overflow-hidden rounded-lg border backdrop-blur-md shadow-lg ${getLevelColor(message.level)}`}
          >
            <div className="flex items-start gap-3 p-3">
              <div className="mt-0.5">{getIcon(message.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-white/90">
                    {message.title}
                  </span>
                  <span className="text-[10px] font-medium text-white/40 tabular-nums">
                    {message.time}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-white/80 line-clamp-2">
                  {message.content}
                </p>
              </div>
              <button
                onClick={() => removeMessage(message.id)}
                className="mt-0.5 text-white/20 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            
            {/* Dynamic progress bar to indicate removal or just for style */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: 0 }}
              transition={{ duration: 15, ease: 'linear' }}
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
