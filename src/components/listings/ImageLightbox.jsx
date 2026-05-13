import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Full-screen image viewer/lightbox for listing photos.
 * Works on iOS Safari, Android Chrome, and TWA/WebView.
 *
 * Props:
 *  - images: array of image entries (string or { w150,w400,w640,w800 })
 *  - open: boolean
 *  - initialIndex: number (which image to show first)
 *  - onClose: (finalIndex?: number) => void  (finalIndex returned so parent can sync)
 *  - getSrc: (image) => string  (resolver to URL, e.g. w/ getListingImageUrl)
 */
export default function ImageLightbox({
  images = [],
  open = false,
  initialIndex = 0,
  onClose,
  getSrc,
}) {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const total = images?.length || 0;

  useEffect(() => {
    if (open) setIndex(Math.max(0, Math.min(initialIndex, total - 1)));
  }, [open, initialIndex, total]);

  useEffect(() => {
    if (!open) return undefined;
    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const prev = useCallback(() => {
    setIndex((i) => (i === 0 ? total - 1 : i - 1));
  }, [total]);

  const next = useCallback(() => {
    setIndex((i) => (i === total - 1 ? 0 : i + 1));
  }, [total]);

  const close = useCallback(() => {
    onClose?.(index);
  }, [onClose, index]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, prev, next]);

  const onTouchStart = (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  };

  const onTouchEnd = (e) => {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const t = e.changedTouches?.[0];
    if (!t) return;
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const SWIPE_MIN = 50;
    if (absDx > SWIPE_MIN && absDx > absDy && total > 1) {
      if (dx < 0) next();
      else prev();
    } else if (absDy > 100 && absDy > absDx) {
      close();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (typeof document === 'undefined') return null;
  const hasImages = total > 0;
  const currentImage = hasImages ? images[index] : null;
  const src = currentImage
    ? typeof getSrc === 'function'
      ? getSrc(currentImage)
      : typeof currentImage === 'string'
      ? currentImage
      : currentImage.w800 || currentImage.w640 || currentImage.w400 || currentImage.w150 || ''
    : '';

  const node = (
    <AnimatePresence>
      {open && hasImages && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center select-none overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="dialog"
          aria-modal="true"
          aria-label="Зургийн харагч"
          style={{ touchAction: 'pan-y' }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            aria-label="Хаах"
            className="absolute top-3 right-3 z-[110] w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm"
          >
            <X className="w-6 h-6" aria-hidden />
          </button>

          {total > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[110] px-3 py-1 rounded-full bg-white/15 text-white text-sm font-medium tabular-nums backdrop-blur-sm pointer-events-none">
              {index + 1} / {total}
            </div>
          )}

          <motion.img
            key={index}
            src={src}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="max-w-full max-h-full w-auto h-auto object-contain"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          />

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Өмнөх зураг"
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-[110] w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm"
              >
                <ChevronLeft className="w-6 h-6" aria-hidden />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Дараагийн зураг"
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-[110] w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm"
              >
                <ChevronRight className="w-6 h-6" aria-hidden />
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(node, document.body);
}
