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
export const MaybeScreenContainer = ({ enabled, ...rest }) => {
  if (Screens?.screensEnabled?.()) {
    return /*#__PURE__*/ _jsx(Screens.ScreenContainer, {
      enabled: enabled,
      ...rest,
    });
  }
  return /*#__PURE__*/ _jsx(View, {
    ...rest,
  });
};
export function MaybeScreen({ enabled, active, ...rest }) {
  if (Screens?.screensEnabled?.()) {
    return /*#__PURE__*/ _jsx(Screens.Screen, {
      enabled: enabled,
      activityState: active,
      ...rest,
    });
  }
  return /*#__PURE__*/ _jsx(View, {
    ...rest,
  });
}
