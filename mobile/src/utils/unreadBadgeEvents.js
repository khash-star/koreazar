/** Доод таб дээрх мессежийн badge-ийг шууд шинэчлэх (Chat / Messages дарахад хүлээлгэхгүй). */
const listeners = new Set();

export function subscribeUnreadTabBadge(fn) {
  if (typeof fn !== "function") return () => {};
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notifyUnreadTabBadge() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}
