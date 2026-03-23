/**
 * Vendored from @react-navigation/bottom-tabs (lib/module/views/ScreenFallback.js).
 * Metro sometimes fails to resolve ./ScreenFallback.js next to BottomTabView (e.g. Windows/OneDrive).
 */
"use strict";

import * as React from "react";
import { View } from "react-native";
import { jsx as _jsx } from "react/jsx-runtime";
let Screens;
try {
  Screens = require("react-native-screens");
} catch (e) {
  // Ignore
}

/** RN 0.76+: pointerEvents must be in style, not as a View prop (avoids deprecation warning). */
function viewPropsWithoutLegacyPointerEvents(rest) {
  if (!rest || typeof rest !== "object") return rest;
  const { pointerEvents, style, ...other } = rest;
  if (!Object.prototype.hasOwnProperty.call(rest, "pointerEvents")) {
    return rest;
  }
  const peStyle = { pointerEvents };
  let nextStyle = style;
  if (style == null) {
    nextStyle = peStyle;
  } else if (Array.isArray(style)) {
    nextStyle = [...style, peStyle];
  } else {
    nextStyle = [style, peStyle];
  }
  return { ...other, style: nextStyle };
}

export const MaybeScreenContainer = ({ enabled, ...rest }) => {
  if (Screens?.screensEnabled?.()) {
    return /*#__PURE__*/ _jsx(Screens.ScreenContainer, {
      enabled: enabled,
      ...rest,
    });
  }
  return /*#__PURE__*/ _jsx(View, viewPropsWithoutLegacyPointerEvents(rest));
};
export function MaybeScreen({ enabled, active, ...rest }) {
  if (Screens?.screensEnabled?.()) {
    return /*#__PURE__*/ _jsx(Screens.Screen, {
      enabled: enabled,
      activityState: active,
      ...rest,
    });
  }
  return /*#__PURE__*/ _jsx(View, viewPropsWithoutLegacyPointerEvents(rest));
}
