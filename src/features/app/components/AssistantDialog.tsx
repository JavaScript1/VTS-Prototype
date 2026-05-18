import { Bot, X, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

const relaxedHotImage = new URL('../../../../AGENTS/image/悠闲-高温度.png', import.meta.url).href;

export type AssistantDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AssistantDialog({ isOpen, onClose }: AssistantDialogProps) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '您好！我是您的智能航运助手。有什么我可以帮您的吗？' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging || dragStateRef.current.pointerId !== event.pointerId) return;

      const dialog = dialogRef.current;
      const dialogWidth = dialog?.offsetWidth ?? 380;
      const dialogHeight = dialog?.offsetHeight ?? 500;
      const nextX = dragStateRef.current.originX + (event.clientX - dragStateRef.current.startX);
      const nextY = dragStateRef.current.originY + (event.clientY - dragStateRef.current.startY);
      const maxX = Math.max(0, window.innerWidth - dialogWidth - 24);
      const maxY = Math.max(0, window.innerHeight - dialogHeight - 24);

      setPosition({
        x: Math.min(Math.max(0, nextX), maxX),
        y: Math.min(Math.max(0, nextY), maxY),
      });
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (dragStateRef.current.pointerId !== event.pointerId) return;
      setIsDragging(false);
      dragStateRef.current.pointerId = -1;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, isOpen]);

  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dialogRef.current) return;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position?.x ?? Math.max(0, window.innerWidth - (dialogRef.current.offsetWidth ?? 380) - 24),
      originY: position?.y ?? Math.max(0, window.innerHeight - (dialogRef.current.offsetHeight ?? 500) - 24),
    };
    setIsDragging(true);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const newMessages = [...messages, { role: 'user', content: inputValue }];
    setMessages(newMessages);
    setInputValue('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: '我正在分析您的问题，请稍候...' }]);
    }, 600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dialogRef}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          style={position ? { left: position.x, top: position.y } : undefined}
          className={`fixed z-[6000] flex h-[500px] w-[380px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/95 shadow-2xl backdrop-blur-xl ${
            position ? '' : 'bottom-6 right-6'
          }`}
        >
          <div
            onPointerDown={handleDragStart}
            className={`flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3 ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20 text-sky-400">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="text-sm font-bold text-white">智能助手</div>
                <div className="text-[10px] text-sky-400/60">在线 · 随时为您服务</div>
              </div>
            </div>
            <button onClick={onClose} className="rounded-full p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="mb-6 flex justify-center">
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-sky-500/20 bg-sky-500/5">
                <img src={relaxedHotImage} alt="Assistant" className="h-full w-full object-contain object-bottom" />
              </div>
            </div>

            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${msg.role === 'user' ? 'bg-sky-500 text-white' : 'border border-white/10 bg-white/5 text-white/90'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 bg-black/40 p-3">
            <div className="relative flex items-center">
              <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="输入您的问题..." className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-4 pr-10 text-xs text-white placeholder:text-white/20 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/50" />
              <button onClick={handleSend} className="absolute right-1 flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 text-white transition-transform hover:scale-110 active:scale-95">
                <Send size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
