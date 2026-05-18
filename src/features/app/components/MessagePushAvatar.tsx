import {
  getAvatarPresentation,
  type MessageFeedItem,
  type MessageFeedMode,
} from './messagePushConfig';
import MessagePushPanel from './MessagePushPanel';

type MessagePushAvatarProps = {
  messages: MessageFeedItem[];
  className?: string;
  onMessagesChange?: (messages: MessageFeedItem[]) => void;
  showBubble?: boolean;
  messageMode?: MessageFeedMode;
};

export default function MessagePushAvatar({ 
  messages, 
  className = '',
  onMessagesChange,
  showBubble = true,
  messageMode = 'manual',
}: MessagePushAvatarProps) {
  const avatar = getAvatarPresentation(messages);

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {showBubble ? (
        <div className="relative mb-4 w-[380px] pointer-events-auto">
          <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-2">
            <MessagePushPanel
              variant="embedded"
              maxMessages={3}
              className="max-h-[300px]"
              messageMode={messageMode}
              onMessagesChange={onMessagesChange}
            />
          </div>
          <div className="absolute -bottom-3 left-1/2 h-0 w-0 -translate-x-1/2 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-[#0a0a0a]/80" />
        </div>
      ) : null}

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
