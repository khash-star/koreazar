const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.zarkorea.com/index.php";

const DEFAULT_TIMEOUT_MS = 8000;

export function buildApiUrl(action, params = {}) {
  const url = new URL(API_BASE_URL);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, String(v));
    }
  });
  return url.toString();
}

function withTimeoutSignal(timeoutMs, externalSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", onAbort, { once: true });
  }
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      if (externalSignal) externalSignal.removeEventListener("abort", onAbort);
    },
  };
}

function isTransientFailure(error, status) {
  if (error?.name === "AbortError") return false;
  if (typeof status === "number") return status >= 500;
  return true;
}

export async function requestJson(url, options = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = 0,
    retryDelayMs = 300,
    signal,
    ...fetchOptions
  } = options;

  const method = String(fetchOptions.method || "GET").toUpperCase();
  const maxRetries = method === "GET" ? Math.max(0, retries) : 0;
  let attempt = 0;

  while (true) {
    const timeoutCtl = withTimeoutSignal(timeoutMs, signal);
    let status;
    try {
      const res = await fetch(url, {
        ...fetchOptions,
        signal: timeoutCtl.signal,
        headers: {
          "Content-Type": "application/json",
          ...(fetchOptions.headers || {}),
        },
      });
      status = res.status;
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(payload?.message || payload?.error || `HTTP ${status}`);
        err.status = status;
        throw err;
      }
      return payload;
    } catch (error) {
      if (attempt >= maxRetries || !isTransientFailure(error, status)) {
        if (error?.name === "AbortError") {
          throw new Error("Холболтын хугацаа дууслаа. Дахин оролдоно уу.");
        }
        const msg = String(error?.message || "").toLowerCase();
        if (
          error?.name === "TypeError" ||
          msg.includes("network request failed") ||
          msg.includes("failed to fetch") ||
          msg.includes("unable to connect")
        ) {
          throw new Error("Сервертэй холбогдож чадсангүй. Интернэт болон API серверээ шалгаад дахин оролдоно уу.");
        }
        throw error;
      }
      attempt += 1;
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
    } finally {
      timeoutCtl.cleanup();
    }
  }
}

