/**
 * Firestore өгөгдлийг бүртгэл устгах үед цэвэрлэнэ (Apple 5.1.1(v)).
 * Auth user устгахыг дуудагч хариуцна.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase/config';

async function deleteSnapshotDocs(snap, collectionName) {
  await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, collectionName, d.id))));
}

export async function deleteAllFirestoreDataForUser(uid, email) {
  if (!uid || !email) throw new Error('UID эсвэл имэйл байхгүй');

  const savedQ = query(
    collection(db, 'saved_listings'),
    where('created_by', '==', email),
    limit(200)
  );
  for (;;) {
    const snap = await getDocs(savedQ);
    if (snap.empty) break;
    await deleteSnapshotDocs(snap, 'saved_listings');
  }

  const listingsQ = query(
    collection(db, 'listings'),
    where('created_by', '==', email),
    orderBy('created_date', 'desc'),
    limit(200)
  );
  for (;;) {
    const snap = await getDocs(listingsQ);
    if (snap.empty) break;
    await deleteSnapshotDocs(snap, 'listings');
  }

  const convQ1 = query(
    collection(db, 'conversations'),
    where('participant_1', '==', email),
    orderBy('last_message_date', 'desc')
  );
  const convQ2 = query(
    collection(db, 'conversations'),
    where('participant_2', '==', email),
    orderBy('last_message_date', 'desc')
  );
  const [snap1, snap2] = await Promise.all([getDocs(convQ1), getDocs(convQ2)]);
  const convIds = new Set();
  snap1.forEach((d) => convIds.add(d.id));
  snap2.forEach((d) => convIds.add(d.id));

  for (const convId of convIds) {
    const msgQ = query(
      collection(db, 'messages'),
      where('conversation_id', '==', convId),
      orderBy('created_date', 'desc'),
      limit(150)
    );
    for (;;) {
      const msgSnap = await getDocs(msgQ);
      if (msgSnap.empty) break;
      await deleteSnapshotDocs(msgSnap, 'messages');
    }
    await deleteDoc(doc(db, 'conversations', convId));
  }

  const aiConvQ = query(
    collection(db, 'ai_conversations'),
    where('user_email', '==', email),
    limit(50)
  );
  let aiConvSnap = await getDocs(aiConvQ);
  while (!aiConvSnap.empty) {
    for (const d of aiConvSnap.docs) {
      const aiConvId = d.id;
      const amQ = query(
        collection(db, 'ai_messages'),
        where('conversation_id', '==', aiConvId),
        limit(150)
      );
      for (;;) {
        const ms = await getDocs(amQ);
        if (ms.empty) break;
        await deleteSnapshotDocs(ms, 'ai_messages');
      }
      await deleteDoc(doc(db, 'ai_conversations', aiConvId));
    }
    aiConvSnap = await getDocs(aiConvQ);
  }

  const aiUsageQ = query(
    collection(db, 'ai_usage'),
    where('user_email', '==', email),
    limit(100)
  );
  for (;;) {
    const uSnap = await getDocs(aiUsageQ);
    if (uSnap.empty) break;
    await deleteSnapshotDocs(uSnap, 'ai_usage');
  }

  await deleteDoc(doc(db, 'users', uid));
}
