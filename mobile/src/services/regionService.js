import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { buildApiUrl, requestJson } from "./apiClient";

/** Persist home market on users/{uid} after API invite redeem or user_sync. */
export async function persistHomeMarketToFirestore(uid, homeCountryCode, homeRegionCode) {
  if (!uid) return;
  const country = String(homeCountryCode || "").trim().toUpperCase();
  const region = String(homeRegionCode || "").trim().toLowerCase();
  if (!country || !region) return;
  try {
    await setDoc(
      doc(db, "users", String(uid)),
      {
        home_country_code: country,
        home_region_code: region,
      },
      { merge: true }
    );
  } catch (e) {
    console.warn("persistHomeMarketToFirestore:", e?.message || e);
  }
}

export async function syncHomeMarketFromUserSync(user) {
  if (!user?.uid) return null;
  try {
    const token = await user.getIdToken();
    const data = await requestJson(buildApiUrl("user_sync"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
      timeoutMs: 10000,
    });
    const country = data?.home_country_code;
    const region = data?.home_region_code;
    if (country && region) {
      await persistHomeMarketToFirestore(user.uid, country, region);
    }
    return { home_country_code: country || null, home_region_code: region || null };
  } catch (e) {
    console.warn("syncHomeMarketFromUserSync:", e?.message || e);
    return null;
  }
}

export async function redeemInviteCode(code) {
  const user = auth.currentUser;
  if (!user?.uid) {
    throw new Error("Sign in to continue");
  }
  const trimmed = String(code || "").trim();
  if (!trimmed) {
    throw new Error("Enter an invite code");
  }
  const token = await user.getIdToken();
  const data = await requestJson(buildApiUrl("invite_redeem"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ code: trimmed }),
    timeoutMs: 10000,
  });
  const country = data?.home_country_code;
  const region = data?.home_region_code;
  if (country && region) {
    await persistHomeMarketToFirestore(user.uid, country, region);
  }
  return {
    home_country_code: country || null,
    home_region_code: region || null,
  };
}
