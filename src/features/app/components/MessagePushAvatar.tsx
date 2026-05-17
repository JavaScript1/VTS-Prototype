import { getAvatarPresentation, type MessageFeedItem } from './messagePushConfig';

type MessagePushAvatarProps = {
  messages: MessageFeedItem[];
  className?: string;
};

export default function MessagePushAvatar({ messages, className = '' }: MessagePushAvatarProps) {
  const avatar = getAvatarPresentation(messages);

  return (
    <div className={`relative shrink-0 overflow-hidden bg-transparent ${className}`}>
      <div className="relative flex min-h-[240px] items-end justify-center px-2 pt-4">
        <img
          src={avatar.imageSrc}
          alt={avatar.title}
          className="max-h-[260px] w-full object-contain object-bottom"
          loading="lazy"
        />
      </div>
    </div>
  );
}
