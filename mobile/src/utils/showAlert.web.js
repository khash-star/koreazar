/**
 * Expo web: Alert.alert нь no-op тул browser dialog ашиглана.
 * Зөвхөн вэб багцонд орно — iOS/Android багцад оролцохгүй.
 */
export function showAlert(title, message, buttons) {
  const full = [title, message].filter(Boolean).join("\n\n");

  if (!buttons || buttons.length === 0) {
    window.alert(full);
    return;
  }

  if (buttons.length === 1) {
    window.alert(full);
    queueMicrotask(() => {
      try {
        buttons[0].onPress?.();
      } catch {
        /* ignore */
      }
    });
    return;
  }

  if (buttons.length === 2) {
    const confirmed = window.confirm(full);
    queueMicrotask(() => {
      try {
        if (confirmed) {
          const primary = buttons.find((b) => b.style !== "cancel") || buttons[buttons.length - 1];
          primary?.onPress?.();
        } else {
          buttons.find((b) => b.style === "cancel")?.onPress?.();
        }
      } catch {
        /* ignore */
      }
    });
    return;
  }

  window.alert(full);
}
