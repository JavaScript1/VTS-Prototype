import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

type MarqueeTextProps = {
  text: string;
  isHovered: boolean;
  className?: string;
};

export default function MarqueeText({ text, isHovered, className }: MarqueeTextProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const textRef = React.useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);

  useEffect(() => {
    if (isHovered && containerRef.current && textRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const textWidth = textRef.current.offsetWidth;
      if (textWidth > containerWidth) {
        setShouldScroll(true);
        setScrollDistance(textWidth - containerWidth);
        return;
      }
    }
    setShouldScroll(false);
  }, [isHovered, text]);

  const speed = 20;
  const duration = shouldScroll ? scrollDistance / speed : 0;

  return (
    <div ref={containerRef} className="relative flex min-w-0 flex-1 items-center overflow-hidden">
      <motion.div
        animate={shouldScroll ? { x: -scrollDistance } : { x: 0 }}
        transition={
          shouldScroll
            ? {
                duration: Math.max(duration, 1),
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'linear',
                repeatDelay: 1.5,
              }
            : { duration: 0.3 }
        }
        className="flex items-center whitespace-nowrap"
      >
        <span ref={textRef} className={className}>
          {text}
        </span>
      </motion.div>
    </div>
  );
}
