/**
 * Nested navigator-оос Root stack дээрх дэлгэц рүү шилжих (жишээ нь Login).
 */
export function getRootNavigator(navigation) {
  let nav = navigation;
  let parent = nav?.getParent?.();
  while (parent) {
    nav = parent;
    parent = nav.getParent?.();
  }
  return nav;
}

export function navigateToLogin(navigation) {
  const root = getRootNavigator(navigation);
  if (root?.navigate) root.navigate("Login");
}

export function navigateToRegister(navigation) {
  const root = getRootNavigator(navigation);
  if (root?.navigate) root.navigate("Register");
}

/** Доод таб (HomeTab, MessagesTab, …) олох */
export function getBottomTabNavigator(navigation) {
  let nav = navigation;
  while (nav) {
    const names = nav.getState?.()?.routeNames;
    if (Array.isArray(names) && names.includes("MessagesTab") && names.includes("HomeTab")) {
      return nav;
    }
    nav = nav.getParent?.();
  }
  return null;
}

/** Мессеж таб → Чат дэлгэц (вэбийн Chat?otherUserEmail=…-тай ижил Firestore) */
export function navigateToMessagesChat(navigation, params) {
  const tab = getBottomTabNavigator(navigation);
  if (tab?.navigate) {
    tab.navigate("MessagesTab", { screen: "Chat", params });
  }
}

/** Нүүр таб → Зарын дэлгэц */
export function navigateToHomeListing(navigation, listingId) {
  const tab = getBottomTabNavigator(navigation);
  if (tab?.navigate) {
    tab.navigate("HomeTab", { screen: "ListingDetail", params: { listingId } });
  }
}

/** Зарын дэлгэц рүү (шинэ нэмсний дараа) */
export function navigateToListingDetail(navigation, listingId) {
  const tab = getBottomTabNavigator(navigation);
  if (tab?.navigate) {
    tab.navigate("HomeTab", { screen: "ListingDetail", params: { listingId } });
  }
}

/** Зар нэмэх таб руу */
export function navigateToCreateListing(navigation) {
  const tab = getBottomTabNavigator(navigation);
  if (tab?.navigate) {
    tab.navigate("CreateTab", { screen: "CreateMain" });
  }
}
