import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';

export const listListingReports = async () => {
  const ref = collection(db, 'listing_reports');
  const q = query(ref, orderBy('created_date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const filterListingReports = async (filters = {}) => {
  const ref = collection(db, 'listing_reports');
  const conditions = [];
  Object.keys(filters).forEach((k) => {
    const v = filters[k];
    if (v !== undefined && v !== null && v !== '') {
      conditions.push(where(k, '==', v));
    }
  });
  const q = query(ref, ...conditions, orderBy('created_date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const createListingReport = async (data) => {
  const ref = collection(db, 'listing_reports');
  const report = {
    ...data,
    status: data.status || 'pending',
    created_date: Timestamp.now(),
  };
  const created = await addDoc(ref, report);
  return { id: created.id, ...report };
};

export const updateListingReport = async (id, data) => {
  const ref = doc(db, 'listing_reports', id);
  await updateDoc(ref, data);
};

export const deleteListingReport = async (id) => {
  const ref = doc(db, 'listing_reports', id);
  await deleteDoc(ref);
};

