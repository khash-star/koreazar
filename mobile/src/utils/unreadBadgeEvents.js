/** Доод tab badge + Messages жагсаалт шинэчлэх. */
const badgeListeners = new Set();
const listListeners = new Set();

export function subscribeUnreadTabBadge(fn) {
  if (typeof fn !== "function") return () => {};
  badgeListeners.add(fn);
  return () => badgeListeners.delete(fn);
}

export function notifyUnreadTabBadge() {
  badgeListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

export function subscribeMessagesListRefresh(fn) {
  if (typeof fn !== "function") return () => {};
  listListeners.add(fn);
  return () => listListeners.delete(fn);
}

export function notifyMessagesListRefresh() {
  listListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
  notifyUnreadTabBadge();
}
