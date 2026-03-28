/**
 * Expo web: зарим орчин (жишээ нь Cursor Simple Browser) window.alert/confirm-ийг блоклодог.
 * Мэдэгдлийг DOM toast / dialog-оор харуулна.
 */

const HOST_ID = "__zarkorea_show_alert_host";
const TOAST_Z = "2147483646";
const DIALOG_Z = "2147483647";

function hasDom() {
  return typeof document !== "undefined" && document.body;
}

function showWebToast(title, message, onDismiss) {
  if (!hasDom()) {
    console.warn("[showAlert]", title, message);
    onDismiss?.();
    return;
  }

  const text = [title, message].filter(Boolean).join("\n\n");
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement("div");
    host.id = HOST_ID;
    Object.assign(host.style, {
      position: "fixed",
      left: "16px",
      right: "16px",
      bottom: "max(24px, env(safe-area-inset-bottom, 0px))",
      zIndex: TOAST_Z,
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      gap: "8px",
      pointerEvents: "none",
    });
    document.body.appendChild(host);
  }

  const card = document.createElement("div");
  Object.assign(card.style, {
    pointerEvents: "auto",
    background: "#111827",
    color: "#f9fafb",
    padding: "14px 16px",
    borderRadius: "12px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "14px",
    lineHeight: "1.45",
    whiteSpace: "pre-wrap",
    maxWidth: "100%",
    cursor: "pointer",
  });
  card.textContent = text;
  card.setAttribute("role", "alert");

  let done = false;
  let tid = null;
  const finish = () => {
    if (done) return;
    done = true;
    if (tid != null) clearTimeout(tid);
    card.remove();
    if (host && host.childNodes.length === 0) {
      host.remove();
    }
    try {
      onDismiss?.();
    } catch {
      /* ignore */
    }
  };

  if (!onDismiss) {
    tid = setTimeout(finish, 5200);
  }
  card.addEventListener("click", finish);

  host.appendChild(card);
}

function showWebTwoButtonDialog(full, buttons) {
  if (!hasDom()) {
    console.warn("[showAlert]", full, buttons);
    return;
  }

  const cancelB = buttons.find((b) => b.style === "cancel");
  const primaryB = buttons.find((b) => b.style !== "cancel") || buttons[buttons.length - 1];

  const backdrop = document.createElement("div");
  backdrop.setAttribute("role", "dialog");
  backdrop.setAttribute("aria-modal", "true");
  Object.assign(backdrop.style, {
    position: "fixed",
    inset: "0",
    zIndex: DIALOG_Z,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  });

  const box = document.createElement("div");
  Object.assign(box.style, {
    background: "#fff",
    color: "#111827",
    padding: "20px",
    borderRadius: "14px",
    maxWidth: "400px",
    width: "100%",
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
  });

  const msg = document.createElement("div");
  Object.assign(msg.style, {
    fontSize: "15px",
    lineHeight: "1.5",
    whiteSpace: "pre-wrap",
    marginBottom: "18px",
  });
  msg.textContent = full;

  const row = document.createElement("div");
  Object.assign(row.style, {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    flexWrap: "wrap",
  });

  const mkBtn = (label, primary) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    Object.assign(b.style, {
      padding: "10px 16px",
      borderRadius: "10px",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      border: primary ? "none" : "1px solid #d1d5db",
      background: primary ? "#ea580c" : "#fff",
      color: primary ? "#fff" : "#374151",
    });
    return b;
  };

  const leftLabel = cancelB?.text || "Болих";
  const rightLabel = primaryB?.text || "OK";

  const btnLeft = mkBtn(leftLabel, false);
  const btnRight = mkBtn(rightLabel, true);

  const cleanup = () => {
    backdrop.remove();
    document.removeEventListener("keydown", onKey);
  };

  const runLeft = () => {
    cleanup();
    queueMicrotask(() => {
      try {
        cancelB?.onPress?.();
      } catch {
        /* ignore */
      }
    });
  };

  const runRight = () => {
    cleanup();
    queueMicrotask(() => {
      try {
        primaryB?.onPress?.();
      } catch {
        /* ignore */
      }
    });
  };

  btnLeft.addEventListener("click", runLeft);
  btnRight.addEventListener("click", runRight);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) runLeft();
  });

  const onKey = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      runLeft();
    }
  };
  document.addEventListener("keydown", onKey);

  row.appendChild(btnLeft);
  row.appendChild(btnRight);
  box.appendChild(msg);
  box.appendChild(row);
  backdrop.appendChild(box);
  document.body.appendChild(backdrop);
}

export function showAlert(title, message, buttons) {
  const full = [title, message].filter(Boolean).join("\n\n");

  if (!buttons || buttons.length === 0) {
    showWebToast(title, message);
    return;
  }

  if (buttons.length === 1) {
    showWebToast(title, message, () => {
      try {
        buttons[0].onPress?.();
      } catch {
        /* ignore */
      }
    });
    return;
  }

  if (buttons.length === 2) {
    showWebTwoButtonDialog(full, buttons);
    return;
  }

  showWebToast(title, `${message ? `${message}\n\n` : ""}(Олон сонголт — console-д харагдана)`);
  console.warn("[showAlert]", title, message, buttons);
}
