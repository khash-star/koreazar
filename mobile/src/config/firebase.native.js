import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn("Firebase config is missing. Fill EXPO_PUBLIC_FIREBASE_* variables.");
}
if (!firebaseConfig.storageBucket) {
  console.warn("Firebase storageBucket missing. Set EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET.");
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

function createAuth() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    if (e?.code === "auth/already-initialized") {
      return getAuth(app);
    }
    throw e;
  }
}

export const auth = createAuth();
export const db = getFirestore(app);

/** `gs://...` — default bucket-ийг тодорхой зааж өгнө (storage/unknown зарим төхөөрөмж дээр буурахад тусална). */
function toGsBucketUrl(bucket) {
  if (!bucket || typeof bucket !== "string") return undefined;
  const b = bucket.trim();
  if (b.startsWith("gs://")) return b;
  return `gs://${b}`;
}

const gsBucket = toGsBucketUrl(firebaseConfig.storageBucket);
export const storage = gsBucket ? getStorage(app, gsBucket) : getStorage(app);

/** REST URL / SDK-д ижил bucket ID (2024+ ихэвчлэн `PROJECT_ID.firebasestorage.app`). */
export function getStorageBucketId() {
  const b = firebaseConfig.storageBucket || "";
  return b.replace(/^gs:\/\//, "").trim();
}

export default app;
