import { useCallback, useEffect, useRef, useState } from 'react';

const PULL_THRESHOLD = 80;
const RESISTANCE = 0.4;

/**
 * Pull-to-refresh for mobile web. Only active on touch devices.
 * @param {() => Promise<void>} onRefresh - Callback to run on refresh (e.g. refetch)
 * @param {boolean} disabled - Disable when already refreshing
 * @returns {{ pullDistance: number, isRefreshing: boolean }}
 */
export function usePullToRefresh(onRefresh, disabled = false) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  const disabledRef = useRef(disabled);
  const isRefreshingRef = useRef(false);

  onRefreshRef.current = onRefresh;
  disabledRef.current = disabled;
  isRefreshingRef.current = isRefreshing;

  const doRefresh = useCallback(async () => {
    if (disabledRef.current || isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    try {
      await onRefreshRef.current();
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!('ontouchstart' in window)) return;

    let currentPull = 0;

    const handleTouchStart = (e) => {
      if (window.scrollY <= 0 && !disabledRef.current && !isRefreshingRef.current) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (startY.current === 0) return;
      if (window.scrollY > 0) {
        startY.current = 0;
        setPullDistance(0);
        currentPull = 0;
        return;
      }
      const delta = (e.touches[0].clientY - startY.current) * RESISTANCE;
      if (delta > 0) {
        currentPull = Math.min(delta, PULL_THRESHOLD * 1.5);
        setPullDistance(currentPull);
      }
    };

    const handleTouchEnd = () => {
      if (startY.current === 0) return;
      if (currentPull >= PULL_THRESHOLD && !disabledRef.current && !isRefreshingRef.current) {
        doRefresh();
      }
      startY.current = 0;
      setPullDistance(0);
      currentPull = 0;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [doRefresh]);

  return { pullDistance, isRefreshing };
}
