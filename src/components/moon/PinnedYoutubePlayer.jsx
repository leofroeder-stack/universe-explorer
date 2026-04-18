import React, { useState } from 'react';
import { X, Youtube, ChevronRight, ChevronLeft, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function getVideoId(url) {
  const match = url?.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function PinnedYoutubePlayer({ url, title, onClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const videoId = getVideoId(url);
  if (!videoId) return null;

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&origin=${encodeURIComponent(window.location.origin)}`;
  const directUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[1500] flex items-center">
      {/* Collapse/expand tab */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center justify-center w-6 h-16 rounded-l-xl bg-zinc-800 border border-r-0 border-white/10 hover:bg-zinc-700 transition-colors shadow-xl"
        title={collapsed ? 'Expand player' : 'Collapse player'}
      >
        {collapsed ? <ChevronLeft className="w-3.5 h-3.5 text-white/60" /> : <ChevronRight className="w-3.5 h-3.5 text-white/60" />}
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden rounded-l-2xl shadow-2xl bg-zinc-950 border border-white/10"
            style={{ minHeight: 220 }}
          >
            <div style={{ width: 320 }}>
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-white/10">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Youtube className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <span className="text-xs font-body font-semibold text-white truncate">{title}</span>
                </div>
                <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                  <a
                    href={directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                    title="Open on YouTube"
                  >
                    <ExternalLink className="w-3 h-3 text-white/50" />
                  </a>
                  <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                    title="Close player"
                  >
                    <X className="w-3.5 h-3.5 text-white/50" />
                  </button>
                </div>
              </div>

              {/* Video */}
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  key={videoId}
                  className="absolute inset-0 w-full h-full"
                  src={embedUrl}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}