import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const HISTORY_MARK = '__imageLightbox';

/**
 * Full-screen image viewer for listing photos (portal → body).
 *
 * UX (multiple images): prev/next loop infinitely (carousel convention) —
 * last → next wraps to first so users never hit a “dead end” on mobile.
 *
 * Performance: only one <img> at a time (current index). No preloading of
 * all w800 variants — safe for 10+ photos (network switches image on swipe).
 *
 * Z-index: above app chrome (nav z-40–50), toasts (z-100), and Radix dialogs (z-50).
 *
 * Close / history: parent onClose is invoked at most once per open (emitCloseOnce + guards
 * for double-tap X / backdrop and pending history.back() before popstate).
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
  const indexRef = useRef(initialIndex);
  const pushedHistoryRef = useRef(false);
  const onCloseRef = useRef(onClose);
  /** Parent onClose must run at most once per open session (avoids double setState / console noise). */
  const closeDispatchedRef = useRef(false);
  /** True after history.back() until popstate — blocks double-tap X / backdrop before popstate runs. */
  const pendingHistoryPopRef = useRef(false);
  /** A11y: refs for focus management. */
  const containerRef = useRef(null);
  const closeBtnRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  const total = images?.length || 0;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const emitCloseOnce = useCallback((idx) => {
    if (closeDispatchedRef.current) return;
    closeDispatchedRef.current = true;
    onCloseRef.current?.(idx);
  }, []);

  useEffect(() => {
    if (open) {
      closeDispatchedRef.current = false;
      pendingHistoryPopRef.current = false;
    }
  }, [open]);

  /**
   * Focus management — prevents "Blocked aria-hidden ... descendant retained focus":
   *  - Remember the element that was focused before opening (e.g. the listing image button).
   *  - Move focus into the dialog (close button) so it is no longer inside background content.
   *  - Restore focus to that element on close if it still exists in the DOM.
   * We do NOT add aria-hidden on app root — the role="dialog" + aria-modal + focused
   * descendant inside the portal is sufficient and avoids the warning.
   */
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    previouslyFocusedRef.current =
      previouslyFocused && previouslyFocused !== document.body ? previouslyFocused : null;

    if (previouslyFocused && typeof previouslyFocused.blur === 'function') {
      try {
        previouslyFocused.blur();
      } catch {
        /* ignore */
      }
    }

    const id = requestAnimationFrame(() => {
      const btn = closeBtnRef.current;
      const container = containerRef.current;
      if (btn && typeof btn.focus === 'function') {
        try {
          btn.focus({ preventScroll: true });
        } catch {
          btn.focus();
        }
      } else if (container && typeof container.focus === 'function') {
        try {
          container.focus({ preventScroll: true });
        } catch {
          container.focus();
        }
      }
    });

    return () => {
      cancelAnimationFrame(id);
      const target = previouslyFocusedRef.current;
      previouslyFocusedRef.current = null;
      if (target && document.contains(target) && typeof target.focus === 'function') {
        try {
          target.focus({ preventScroll: true });
        } catch {
          target.focus();
        }
      }
    };
  }, [open]);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    if (open) setIndex(Math.max(0, Math.min(initialIndex, total - 1)));
  }, [open, initialIndex, total]);

  useEffect(() => {
    if (!open) return undefined;
    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;
    const originalBodyOverflow = body.style.overflow;
    const originalHtmlOverflow = html.style.overflow;
    const originalPosition = body.style.position;
    const originalTop = body.style.top;
    const originalWidth = body.style.width;

    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      body.style.overflow = originalBodyOverflow;
      html.style.overflow = originalHtmlOverflow;
      body.style.position = originalPosition;
      body.style.top = originalTop;
      body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  /** Android TWA / browser back: one dummy history entry; Back pops it and closes via popstate. */
  useEffect(() => {
    if (!open) return undefined;

    if (!window.history.state?.[HISTORY_MARK]) {
      window.history.pushState({ [HISTORY_MARK]: true }, '', window.location.href);
    }
    pushedHistoryRef.current = true;

    const onPopState = () => {
      pendingHistoryPopRef.current = false;
      pushedHistoryRef.current = false;
      emitCloseOnce(indexRef.current);
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [open, emitCloseOnce]);

  const requestCloseViaHistory = useCallback(() => {
    if (closeDispatchedRef.current) return;
    if (pendingHistoryPopRef.current) return;

    if (pushedHistoryRef.current && window.history.state?.[HISTORY_MARK]) {
      pendingHistoryPopRef.current = true;
      window.history.back();
      return;
    }
    emitCloseOnce(indexRef.current);
  }, [emitCloseOnce]);

  const prev = useCallback(() => {
    setIndex((i) => (i === 0 ? total - 1 : i - 1));
  }, [total]);

  const next = useCallback(() => {
    setIndex((i) => (i === total - 1 ? 0 : i + 1));
  }, [total]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') requestCloseViaHistory();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, requestCloseViaHistory, prev, next]);

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
      requestCloseViaHistory();
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

  const safeTop = 'max(0.75rem, env(safe-area-inset-top, 0px))';
  const safeRight = 'max(0.75rem, env(safe-area-inset-right, 0px))';
  const safeLeft = 'max(0.5rem, env(safe-area-inset-left, 0px))';

  const node = (
    <AnimatePresence>
      {open && hasImages && (
        <motion.div
          ref={containerRef}
          tabIndex={-1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9998] bg-black/90 flex flex-col select-none overscroll-none outline-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) requestCloseViaHistory();
          }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="dialog"
          aria-modal="true"
          aria-label="Зургийн харагч"
          style={{
            // Prevent iOS Safari from pinch-zooming the page under the overlay (image “vanishing”).
            touchAction: 'none',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingRight: 'env(safe-area-inset-right, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            paddingLeft: 'env(safe-area-inset-left, 0px)',
          }}
        >
          <button
            ref={closeBtnRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              requestCloseViaHistory();
            }}
            aria-label="Хаах"
            className="absolute z-[9999] w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            style={{ top: safeTop, right: safeRight }}
          >
            <X className="w-6 h-6" aria-hidden />
          </button>

          {total > 1 && (
            <div
              className="absolute z-[9999] left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/15 text-white text-sm font-medium tabular-nums backdrop-blur-sm pointer-events-none"
              style={{ top: `calc(${safeTop} + 2.75rem)` }}
            >
              {index + 1} / {total}
            </div>
          )}

          {/* min-h-0 + flex keeps object-contain image visible on iOS when zoom / layout reflows */}
          <div className="relative flex-1 flex min-h-0 min-w-0 w-full items-center justify-center px-2 pt-14 pb-6">
            <motion.img
              key={index}
              src={src}
              alt=""
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="max-h-full max-w-full h-auto w-auto object-contain"
              draggable={false}
              decoding="async"
              loading="eager"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Өмнөх зураг"
                className="absolute z-[9999] top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm md:left-4"
                style={{ left: safeLeft }}
              >
                <ChevronLeft className="w-6 h-6" aria-hidden />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label={index === total - 1 ? 'Эхний зураг руу (давтах)' : 'Дараагийн зураг'}
                className="absolute z-[9999] top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm md:right-4"
                style={{ right: safeRight }}
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
