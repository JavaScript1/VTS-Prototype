/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, Ban, Check, CloudRain, Compass, RotateCcw, X } from 'lucide-react';
import { type PushMessage } from '../../../types';

const AUTO_APPROVE_SECONDS = 20;
const PUSH_INTERVAL_MS = 5500;
const WARMUP_PUSH_DELAYS = [1800, 3600];

const MOCK_INTENTS = [
  {
    title: '意图识别',
    content: "识别到 'COSCO SHIPPING' 意图：靠泊 粮油码头 A1",
    level: 'info',
    suggestion: '建议批准靠泊申请，并指派拖轮“沪港拖01”协助。',
    hasActions: true,
  },
  {
    title: '意图识别',
    content: "识别到 'EVER GIVEN' 意图：通过 苏伊士运河",
    level: 'info',
    suggestion: '建议保持当前航速，注意河道窄段。',
    hasActions: false,
  },
  {
    title: '意图识别',
    content: "识别到 'MAERSK ALABAMA' 意图：前往 锚地 A2",
    level: 'info',
    suggestion: '建议引导其进入 A2 锚地 3 号位。',
    hasActions: true,
  },
];

const MOCK_WARNINGS = [
  {
    title: '预警信息',
    content: "预警：'SHIP A' 偏离航道 0.5nm",
    level: 'warning',
    suggestion: '系统已发出修正指令，建议值班员持续观察。',
    hasActions: true,
  },
  {
    title: '碰撞风险',
    content: "预警：'SHIP B' 与 'SHIP C' 存在碰撞风险 (CPA < 0.1nm)",
    level: 'emergency',
    suggestion: '立即通过 VHF 呼叫双方避让。',
    hasActions: true,
  },
  {
    title: '进入禁区',
    content: "警报：'SHIP D' 进入禁航区",
    level: 'emergency',
    suggestion: '立即指派海巡船进行干预。',
    hasActions: true,
  },
];

const MOCK_WEATHER = [
  {
    title: '天气提醒',
    content: '区域 A 预计 10 分钟后有强降雨',
    level: 'info',
    suggestion: '建议周边船舶减速航行。',
    hasActions: false,
  },
  {
    title: '能见度提醒',
    content: '港口能见度下降至 500m',
    level: 'warning',
    suggestion: '建议启动大雾天气航行管制预案。',
    hasActions: true,
  },
  {
    title: '大风预警',
    content: '阵风达到 7 级，请注意航行安全',
    level: 'warning',
    suggestion: '建议锚泊船加强值班，防止走锚。',
    hasActions: false,
  },
];

export type MessagePushPanelProps = {
  variant?: 'floating' | 'embedded';
  maxMessages?: number;
  title?: string;
  className?: string;
};

function MessageItem({
  message,
  onRemove,
  onAutoApprove,
}: {
  message: PushMessage;
  onRemove: (id: string) => void;
  onAutoApprove: (message: PushMessage) => void;
}) {
  const [timeLeft, setTimeLeft] = useState(AUTO_APPROVE_SECONDS);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const icon =
    message.type === 'intent' ? (
      <Compass size={14} className="text-sky-400" />
    ) : message.type === 'warning' ? (
      <AlertTriangle size={14} className="text-red-400" />
    ) : (
      <CloudRain size={14} className="text-teal-400" />
    );

  const levelClass =
    message.level === 'emergency'
      ? 'border-red-500/50 bg-red-500/15 shadow-red-500/10'
      : message.level === 'warning'
        ? 'border-orange-500/50 bg-orange-500/15 shadow-orange-500/10'
        : 'border-white/10 bg-white/10 shadow-black/20';

  return (
    <motion.div
      layout
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className={`pointer-events-auto relative overflow-hidden rounded-lg border shadow-2xl backdrop-blur-xl transition-all duration-300 ${levelClass}`}
    >
      <div className="flex min-h-[64px] items-stretch">
        <div className="flex flex-1 flex-col border-r border-white/5 p-3">
          <div className="mb-1 flex items-center gap-2">
            <div className="rounded-full bg-white/5 p-1">{icon}</div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
              {message.title}
            </span>
            <span className="ml-auto text-[9px] font-medium tabular-nums text-white/30">
              {message.time}
            </span>
          </div>

          <p className="mb-1 line-clamp-1 text-[11px] font-bold leading-tight text-white">
            {message.content}
          </p>

          {message.suggestion && (
            <p className="line-clamp-1 text-[10px] italic leading-tight text-sky-400/80">
              建议：{message.suggestion}
            </p>
          )}
        </div>

        <div className="flex w-[85px] flex-col justify-start gap-1 bg-black/20 p-1.5">
          {message.hasActions ? (
            <>
              <button
                onClick={() => onRemove(message.id)}
                className="flex h-6 items-center justify-center rounded border border-emerald-500/30 bg-emerald-500/20 text-emerald-400 transition-all hover:bg-emerald-500/30"
              >
                <Check size={12} className="mr-1" />
                <span className="text-[9px] font-black">批准({timeLeft})</span>
              </button>
              <button className="flex h-6 items-center justify-center rounded border border-amber-500/20 bg-amber-500/10 text-amber-400/80 transition-all hover:bg-amber-500/20">
                <RotateCcw size={10} className="mr-1" />
                <span className="text-[9px] font-black">重办</span>
              </button>
              <button
                onClick={() => onRemove(message.id)}
                className="flex h-6 items-center justify-center rounded border border-rose-500/30 bg-rose-500/20 text-rose-400 transition-all hover:bg-rose-500/30"
              >
                <Ban size={12} className="mr-1" />
                <span className="text-[9px] font-black">拒绝</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => onRemove(message.id)}
              className="flex h-6 items-center justify-center rounded border border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/10"
            >
              忽略
            </button>
          )}
        </div>

        <button
          onClick={() => onRemove(message.id)}
          className="absolute right-0.5 top-0.5 p-0.5 text-white/5 transition-colors hover:text-white"
        >
          <X size={8} />
        </button>
      </div>

      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: 0 }}
        transition={{ duration: AUTO_APPROVE_SECONDS, ease: 'linear' }}
        onAnimationComplete={() => onAutoApprove(message)}
        className={`absolute bottom-0 left-0 h-0.5 ${
          message.level === 'emergency'
            ? 'bg-red-500'
            : message.level === 'warning'
              ? 'bg-orange-500'
              : 'bg-sky-500'
        }`}
      />
    </motion.div>
  );
}

export default function MessagePushPanel({
  variant = 'floating',
  maxMessages = 8,
  title,
  className = '',
}: MessagePushPanelProps) {
  const [messages, setMessages] = useState<PushMessage[]>([]);

  useEffect(() => {
    const addRandomMessage = () => {
      const types: Array<'intent' | 'warning' | 'weather'> = ['intent', 'warning', 'weather'];
      const type = types[Math.floor(Math.random() * types.length)];

      const source =
        type === 'intent' ? MOCK_INTENTS : type === 'warning' ? MOCK_WARNINGS : MOCK_WEATHER;
      const template = source[Math.floor(Math.random() * source.length)];

      const newMessage: PushMessage = {
        id: Math.random().toString(36).slice(2, 11),
        type,
        title: template.title,
        content: template.content,
        level: template.level,
        suggestion: template.suggestion,
        hasActions: template.hasActions,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };

      setMessages((prev) => [newMessage, ...prev].slice(0, maxMessages));
    };

    addRandomMessage();
    const warmupTimers = WARMUP_PUSH_DELAYS.map((delay) =>
      window.setTimeout(addRandomMessage, delay),
    );
    const interval = window.setInterval(addRandomMessage, PUSH_INTERVAL_MS);

    return () => {
      warmupTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearInterval(interval);
    };
  }, [maxMessages]);

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((message) => message.id !== id));
  };

  const handleAutoApprove = (message: PushMessage) => {
    if (message.hasActions) {
      console.log(`[Auto-Approve] Message ${message.id} approved by timeout.`);
    }
    removeMessage(message.id);
  };

  const list = (
    <AnimatePresence initial={false}>
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onRemove={removeMessage}
          onAutoApprove={handleAutoApprove}
        />
      ))}
    </AnimatePresence>
  );

  if (variant === 'embedded') {
    return (
      <div className={`flex h-full min-h-0 flex-col ${className}`}>
        <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">{list}</div>
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute right-6 top-24 z-[1000] flex w-[420px] flex-col gap-2 ${className}`}
    >
      {list}
    </div>
  );
}
