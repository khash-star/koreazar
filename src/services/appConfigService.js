/**
 * App config stored in Firestore (config/app).
 * listingAutoApprove: when true, new listings get status "active" immediately.
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

const CONFIG_PATH = 'config/app';

export async function getListingAutoApprove() {
  try {
    const ref = doc(db, CONFIG_PATH);
    const snap = await getDoc(ref);
    return snap.exists() && snap.data()?.listingAutoApprove === true;
  } catch {
    return false;
  }
}

/**
 * Set listingAutoApprove. Call from admin only.
 */
export async function setListingAutoApprove(value) {
  const ref = doc(db, CONFIG_PATH);
  await setDoc(ref, { listingAutoApprove: !!value }, { merge: true });
}
