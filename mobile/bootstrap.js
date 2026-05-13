/**
 * Expo web entry: reanimated ачаалахгүй.
 * iOS/Android: Metro нь bootstrap.native.js сонгоно (reanimated шаардлага).
 *
 * Web-only console filters for noisy dev warnings emitted by react-native-web /
 * @react-navigation internals (not our code). LogBox.ignoreLogs does NOT touch
 * Chrome's DevTools console, so we filter at the console.warn/error level.
 */
if (
  typeof window !== "undefined" &&
  typeof __DEV__ !== "undefined" &&
  __DEV__
) {
  const IGNORE_PATTERNS = [
    "props.pointerEvents is deprecated",
    "shadow* style props are deprecated",
    'Blocked aria-hidden on an element because its descendant retained focus',
  ];
  const shouldIgnore = (args) => {
    const first = args && args[0];
    if (typeof first !== "string") return false;
    return IGNORE_PATTERNS.some((p) => first.indexOf(p) !== -1);
  };
  const origWarn = window.console.warn?.bind(window.console);
  const origError = window.console.error?.bind(window.console);
  if (origWarn) {
    window.console.warn = (...args) => {
      if (shouldIgnore(args)) return;
      origWarn(...args);
    };
  }
  if (origError) {
    window.console.error = (...args) => {
      if (shouldIgnore(args)) return;
      origError(...args);
    };
  }
}
