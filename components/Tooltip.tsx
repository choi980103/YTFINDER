"use client";

import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  text: string;
  children?: React.ReactNode;
}

export default function Tooltip({ text, children }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  const updatePos = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.top - 8,
        left: Math.max(100, Math.min(rect.left + rect.width / 2, window.innerWidth - 100)),
      });
    }
  }, []);

  const handleEnter = () => {
    updatePos();
    setShow(true);
  };

  return (
    <span
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setShow(false)}
      onClick={() => {
        if (!show) updatePos();
        setShow((v) => !v);
      }}
    >
      {children || (
        <svg
          className="h-3.5 w-3.5 cursor-help text-zinc-500 transition-colors hover:text-zinc-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          />
        </svg>
      )}
      {show &&
        createPortal(
          <span
            className="pointer-events-none fixed z-[9999] w-48 -translate-x-1/2 -translate-y-full break-keep rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs leading-relaxed text-zinc-300 shadow-xl"
            style={{ top: pos.top, left: pos.left }}
          >
            {text}
            <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-white/10 bg-zinc-900" />
          </span>,
          document.body
        )}
    </span>
  );
}
