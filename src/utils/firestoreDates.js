/**
 * Convert Firestore Timestamp to JavaScript Date
 * @param {*} value - Firestore Timestamp or other value
 * @returns {Date|*} Converted Date or original value
 */
export function convertTimestamp(value) {
  if (!value) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  if (value.seconds !== undefined) {
    return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1000000);
  }
  return value;
}
