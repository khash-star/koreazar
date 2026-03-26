import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';

export const createFeedback = async (data) => {
  const ref = collection(db, 'feedback_messages');
  const payload = {
    ...data,
    status: 'new',
    created_date: Timestamp.now(),
  };

  const created = await addDoc(ref, payload);
  return { id: created.id, ...payload };
};

