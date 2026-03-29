/** Одоо нээлттэй чатын ярианы ID — ижил ярианд push-ийн дуу/баннер дахин гаргахгүй */
let activeConversationId = null;

export function setActiveChatConversationId(id) {
  activeConversationId = id ? String(id) : null;
}

export function getActiveChatConversationId() {
  return activeConversationId;
}
