/** Апп icon / таб дээрх зар-тай badge-ийг шууд дахин тоолох (батлах, устгах, шинэ зар илгээх). */
const listeners = new Set();

export function subscribeListingBadgeRefresh(fn) {
  if (typeof fn !== "function") return () => {};
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notifyListingBadgeRefresh() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}
