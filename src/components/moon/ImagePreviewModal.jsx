import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Image, ExternalLink, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fetch real NASA images for a search query
async function fetchNasaImages(query) {
  const res = await fetch(
    `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image&page_size=8`
  );
  const json = await res.json();
  return (json.collection?.items || []).map(item => ({
    url: item.links?.[0]?.href,
    title: item.data?.[0]?.title,
    description: item.data?.[0]?.description,
    center: item.data?.[0]?.center,
    date: item.data?.[0]?.date_created?.split('T')[0],
    nasaId: item.data?.[0]?.nasa_id,
  })).filter(img => img.url);
}

export default function ImagePreviewModal({ images: staticImages, markerName, color, isOpen, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nasaImages, setNasaImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !markerName) return;
    setCurrentIndex(0);
    setNasaImages([]);
    setLoading(true);
    fetchNasaImages(markerName)
      .then(imgs => setNasaImages(imgs))
      .catch(() => setNasaImages([]))
      .finally(() => setLoading(false));
  }, [isOpen, markerName]);

  if (!isOpen) return null;

  // Merge NASA images first, then static fallbacks
  const allImages = [
    ...nasaImages,
    ...(staticImages || []).map(url => ({ url, title: markerName, description: '', center: 'Wikimedia Commons', date: '' })),
  ];

  const current = allImages[currentIndex];
  const prev = () => setCurrentIndex(i => (i - 1 + allImages.length) % allImages.length);
  const next = () => setCurrentIndex(i => (i + 1) % allImages.length);
  const nasaPageUrl = current?.nasaId
    ? `https://images.nasa.gov/details/${current.nasaId}`
    : null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative max-w-3xl w-full bg-card rounded-2xl overflow-hidden shadow-2xl border border-border"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border" style={{ borderColor: color + '30' }}>
            <div className="flex items-center gap-2 min-w-0">
              <Image className="w-4 h-4 flex-shrink-0" style={{ color }} />
              <span className="font-heading font-semibold text-sm text-foreground truncate">{markerName}</span>
              {allImages.length > 0 && (
                <span className="text-xs text-muted-foreground font-body flex-shrink-0">{currentIndex + 1} / {allImages.length}</span>
              )}
            </div>
            <div className="flex items-center gap-2 ml-2">
              {nasaPageUrl && (
                <a
                  href={nasaPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-xs text-muted-foreground"
                >
                  <ExternalLink className="w-3 h-3" />
                  NASA
                </a>
              )}
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Image area */}
          <div className="relative bg-black flex items-center justify-center" style={{ minHeight: '380px', maxHeight: '65vh' }}>
            {loading && allImages.length === 0 ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm font-body">Loading NASA images…</p>
              </div>
            ) : allImages.length === 0 ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground p-8">
                <Image className="w-10 h-10 opacity-30" />
                <p className="text-sm font-body">No images found</p>
              </div>
            ) : (
              <>
                <img
                  key={current?.url}
                  src={current?.url}
                  alt={current?.title || markerName}
                  className="max-w-full max-h-[65vh] object-contain"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={next}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Caption + source */}
          {current && (
            <div className="px-5 py-3 border-t border-border bg-card/95 space-y-1">
              {current.title && (
                <p className="text-xs font-body font-semibold text-foreground leading-snug line-clamp-1">{current.title}</p>
              )}
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] text-muted-foreground font-body leading-snug line-clamp-2 flex-1">
                  {current.description || 'NASA public domain imagery.'}
                </p>
              </div>
              <p className="text-[10px] font-body" style={{ color: color + 'cc' }}>
                Source: {current.nasaId ? `NASA Image Library (${current.center || 'NASA'})` : current.center || 'Wikimedia Commons'}{current.date ? ` · ${current.date}` : ''} — Public Domain
              </p>
            </div>
          )}

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2 px-5 py-3 border-t border-border overflow-x-auto">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    i === currentIndex ? 'border-primary' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}