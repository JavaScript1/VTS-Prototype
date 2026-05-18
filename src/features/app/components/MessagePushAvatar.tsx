import { getAvatarPresentation, type MessageFeedItem } from './messagePushConfig';
import MessagePushPanel from './MessagePushPanel';

type MessagePushAvatarProps = {
  messages: MessageFeedItem[];
  className?: string;
  onMessagesChange?: (messages: MessageFeedItem[]) => void;
};

export default function MessagePushAvatar({ 
  messages, 
  className = '',
  onMessagesChange 
}: MessagePushAvatarProps) {
  const avatar = getAvatarPresentation(messages);

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* 消息气泡框 - 迁移到脑瓜顶上 */}
      <div className="relative mb-4 w-[380px] pointer-events-auto">
        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-2">
          <MessagePushPanel
            variant="embedded"
            maxMessages={3}
            className="max-h-[300px]"
            onMessagesChange={onMessagesChange}
          />
        </div>
        {/* 气泡尖尖 */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-[#0a0a0a]/80"></div>
      </div>

      {/* 数字人形象 */}
      <div className="relative shrink-0 overflow-hidden bg-transparent">
        <div className="relative flex min-h-[200px] items-end justify-center px-2">
          <img
            src={avatar.imageSrc}
            alt={avatar.title}
            className="max-h-[220px] w-full object-contain object-bottom"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
