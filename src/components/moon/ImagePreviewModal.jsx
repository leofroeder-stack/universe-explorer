import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImagePreviewModal({ images, markerName, color, isOpen, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || !images || images.length === 0) return null;

  const prev = () => setCurrentIndex(i => (i - 1 + images.length) % images.length);
  const next = () => setCurrentIndex(i => (i + 1) % images.length);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
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
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4" style={{ color }} />
              <span className="font-heading font-semibold text-sm text-foreground">{markerName}</span>
              {images.length > 1 && (
                <span className="text-xs text-muted-foreground font-body">{currentIndex + 1} / {images.length}</span>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Image */}
          <div className="relative bg-black flex items-center justify-center" style={{ minHeight: '400px', maxHeight: '70vh' }}>
            <img
              src={images[currentIndex]}
              alt={`${markerName} - image ${currentIndex + 1}`}
              className="max-w-full max-h-[70vh] object-contain"
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800'; }}
            />

            {images.length > 1 && (
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
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 px-5 py-3 border-t border-border overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    i === currentIndex ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}