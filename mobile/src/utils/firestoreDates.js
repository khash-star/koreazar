/** Firestore Timestamp | Date | { seconds } → Date */
export function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  if (value.seconds != null) return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1e6);
  return null;
}
