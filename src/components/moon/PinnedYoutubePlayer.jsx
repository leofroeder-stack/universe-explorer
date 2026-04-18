import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Youtube, ExternalLink, Minus, Maximize2, Minimize2, GripHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function getVideoId(url) {
  const match = url?.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

const MIN_W = 240;
const MIN_H = 160;
const DEFAULT_W = 360;
const DEFAULT_H = 240;
const MINI_W = 160;
const MINI_H = 100;

export default function PinnedYoutubePlayer({ url, title, onClose }) {
  const videoId = getVideoId(url);
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState({ x: window.innerWidth - DEFAULT_W - 24, y: window.innerHeight / 2 - DEFAULT_H / 2 });
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });

  // Drag state
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Resize state
  const resizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const clampPos = useCallback((x, y, w, h) => ({
    x: Math.max(0, Math.min(window.innerWidth - w, x)),
    y: Math.max(0, Math.min(window.innerHeight - h, y)),
  }), []);

  // ── Drag ──────────────────────────────────────────────────────────────────
  const onDragStart = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  }, [pos]);

  // ── Resize (bottom-right corner) ─────────────────────────────────────────
  const onResizeStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h };
  }, [size]);

  useEffect(() => {
    const onMove = (e) => {
      if (dragging.current) {
        const nx = e.clientX - dragOffset.current.x;
        const ny = e.clientY - dragOffset.current.y;
        const clamped = clampPos(nx, ny, minimized ? MINI_W : size.w, minimized ? MINI_H : size.h);
        setPos(clamped);
      }
      if (resizing.current) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        const nw = Math.max(MIN_W, resizeStart.current.w + dx);
        const nh = Math.max(MIN_H, resizeStart.current.h + dy);
        setSize({ w: nw, h: nh });
      }
    };
    const onUp = () => { dragging.current = false; resizing.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [clampPos, minimized, size]);

  if (!videoId) return null;

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&origin=${encodeURIComponent(window.location.origin)}`;
  const directUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const curW = minimized ? MINI_W : size.w;
  const curH = minimized ? MINI_H : size.h;

  return (
    <div
      className="fixed z-[1500] select-none"
      style={{ left: pos.x, top: pos.y, width: curW }}
    >
      <div
        className="rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{
          background: 'rgba(15,15,20,0.97)',
          border: '1px solid rgba(255,255,255,0.12)',
          width: curW,
          height: minimized ? 'auto' : curH + 38, // 38px header
        }}
      >
        {/* ── Header / drag handle ─────────────────────────────────────── */}
        <div
          onMouseDown={onDragStart}
          className="flex items-center justify-between px-2.5 py-1.5 bg-zinc-900 border-b border-white/10 cursor-grab active:cursor-grabbing flex-shrink-0"
          style={{ userSelect: 'none' }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <GripHorizontal className="w-3 h-3 text-white/30 flex-shrink-0" />
            <Youtube className="w-3 h-3 text-red-500 flex-shrink-0" />
            {!minimized && (
              <span className="text-[11px] font-body font-semibold text-white/80 truncate max-w-[120px]">{title}</span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              onMouseDown={e => e.stopPropagation()}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              title="Open on YouTube"
            >
              <ExternalLink className="w-3 h-3 text-white/40" />
            </a>
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={() => setMinimized(m => !m)}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              title={minimized ? 'Expand' : 'Minimize'}
            >
              {minimized ? <Maximize2 className="w-3 h-3 text-white/40" /> : <Minus className="w-3 h-3 text-white/40" />}
            </button>
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={onClose}
              className="p-1 rounded hover:bg-red-600/30 transition-colors"
              title="Close"
            >
              <X className="w-3 h-3 text-white/40" />
            </button>
          </div>
        </div>

        {/* ── Video ────────────────────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {!minimized && (
            <motion.div
              key="video"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: curH, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="relative overflow-hidden flex-1"
              style={{ minHeight: 0 }}
            >
              <iframe
                key={videoId}
                className="absolute inset-0 w-full h-full"
                src={embedUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />

              {/* ── Resize handle (bottom-right) ──────────────────────── */}
              <div
                onMouseDown={onResizeStart}
                className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize z-10 flex items-end justify-end p-0.5"
                title="Resize"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M9 1L1 9M9 5L5 9M9 9" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}