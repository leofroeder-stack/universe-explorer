import React, { useState } from 'react';
import { X, ExternalLink, Youtube, PanelRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function getVideoId(url) {
  const match = url?.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function YoutubeModal({ url, title, isOpen, onClose, onPin }) {
  const [embedFailed, setEmbedFailed] = useState(false);
  const videoId = getVideoId(url);
  const embedUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&origin=${encodeURIComponent(window.location.origin)}`
    : null;
  const directUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

  const handleClose = () => {
    setEmbedFailed(false);
    onClose();
  };

  const handlePin = () => {
    setEmbedFailed(false);
    onPin?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && videoId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl bg-zinc-950 border border-white/10"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <Youtube className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-sm font-body font-semibold text-white truncate">{title}</span>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                {/* Pin to side panel button */}
                {onPin && (
                  <button
                    onClick={handlePin}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 transition-colors text-xs font-body"
                    title="Pin player to side panel"
                  >
                    <PanelRight className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Pin to side</span>
                  </button>
                )}
                <a
                  href={directUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs text-white/70"
                  title="Open on YouTube"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden sm:inline">YouTube</span>
                </a>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>
              </div>
            </div>

            {/* Video area */}
            {!embedFailed ? (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  key={videoId}
                  className="absolute inset-0 w-full h-full"
                  src={embedUrl}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  onError={() => setEmbedFailed(true)}
                />
              </div>
            ) : (
              <div className="relative w-full bg-zinc-900 flex flex-col items-center justify-center gap-4 py-12">
                {thumbnailUrl && (
                  <img src={thumbnailUrl} alt={title} className="w-48 rounded-xl opacity-60" />
                )}
                <p className="text-white/60 text-sm font-body text-center px-6">
                  This video cannot be embedded due to YouTube restrictions.
                </p>
                <a
                  href={directUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all"
                >
                  <Youtube className="w-4 h-4" />
                  Watch on YouTube
                </a>
              </div>
            )}

            {/* Attribution */}
            <div className="px-4 py-2 bg-zinc-900/80 border-t border-white/5">
              <p className="text-[10px] text-white/30 font-body">
                Video content courtesy of YouTube / original rights holders. Universe Explorer does not host any video content.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}