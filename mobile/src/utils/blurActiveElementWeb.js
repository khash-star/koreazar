import { Platform } from "react-native";

/**
 * React Native Web: stack/tab нэвтрэхэд нуугдсан дэлгэц дээр aria-hidden тавигдахад
 * TextInput фокус үлдвэл "Blocked aria-hidden… descendant retained focus" гэж анхааруулна.
 * Дэлгэцийн focus алдах үед идэвхтэй элементийг blur хийнэ.
 */
export function blurActiveElementWeb() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const run = () => {
    const el = document.activeElement;
    if (el && el !== document.body && typeof el.blur === "function") el.blur();
  };
  run();
  requestAnimationFrame(() => {
    run();
    requestAnimationFrame(run);
  });
}
