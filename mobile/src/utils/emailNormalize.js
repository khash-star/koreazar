/** Firebase / Firestore-той ижил имэйлийг нэг мөрөнд тааруулах */
export function normalizeEmail(e) {
  return String(e || "").trim().toLowerCase();
}
