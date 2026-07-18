import assert from 'node:assert/strict';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  terminate,
  updateDoc,
} from 'firebase/firestore';

const projectId = 'demo-koreazar-banner-scope';
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

if (!emulatorHost) {
  throw new Error(
    'FIRESTORE_EMULATOR_HOST is required. Run this script through Firebase emulators:exec.',
  );
}

const [host, portText] = emulatorHost.split(':');
const port = Number(portText);
const restBase =
  `http://${emulatorHost}/v1/projects/${projectId}/databases/(default)/documents`;

async function seedDocument(path, fields) {
  const response = await fetch(`${restBase}/${path}`, {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer owner',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) {
    throw new Error(`Failed to seed ${path}: ${response.status} ${await response.text()}`);
  }
}

function createClient(uid, email) {
  const app = initializeApp({ projectId }, `${uid}-${Date.now()}-${Math.random()}`);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, host, port, {
    mockUserToken: { sub: uid, email },
  });
  return { app, db };
}

async function expectDenied(operation, label) {
  await assert.rejects(operation, (error) => {
    assert.equal(error?.code, 'permission-denied', `${label}: unexpected error ${error}`);
    return true;
  });
}

async function closeClient(client) {
  await terminate(client.db);
  await deleteApp(client.app);
}

await Promise.all([
  seedDocument('users/region-admin', {
    role: { stringValue: 'region_admin' },
    admin_country_code: { stringValue: 'US' },
    admin_region_code: { stringValue: 'washington-dc' },
    email: { stringValue: 'region@example.com' },
  }),
  seedDocument('users/country-admin', {
    role: { stringValue: 'country_admin' },
    admin_country_code: { stringValue: 'KR' },
    email: { stringValue: 'country@example.com' },
  }),
  seedDocument('users/super-admin', {
    role: { stringValue: 'super_admin' },
    email: { stringValue: 'super@example.com' },
  }),
  seedDocument('banner_ads/us-banner', {
    country_code: { stringValue: 'US' },
    title: { stringValue: 'US banner' },
    is_active: { booleanValue: true },
  }),
  seedDocument('banner_ads/kr-banner', {
    country_code: { stringValue: 'KR' },
    title: { stringValue: 'KR banner' },
    is_active: { booleanValue: true },
  }),
]);

const regionAdmin = createClient('region-admin', 'region@example.com');
const countryAdmin = createClient('country-admin', 'country@example.com');
const superAdmin = createClient('super-admin', 'super@example.com');

try {
  const usBanner = doc(regionAdmin.db, 'banner_ads', 'us-banner');
  await updateDoc(usBanner, { title: 'Allowed US edit' });
  await expectDenied(
    updateDoc(usBanner, { country_code: 'KR' }),
    'region admin moving a US banner to KR',
  );
  await expectDenied(
    updateDoc(usBanner, { country_code: 'GLOBAL' }),
    'region admin making a US banner global',
  );

  const krBanner = doc(countryAdmin.db, 'banner_ads', 'kr-banner');
  await updateDoc(krBanner, { title: 'Allowed KR edit' });
  await expectDenied(
    updateDoc(krBanner, { country_code: 'US' }),
    'country admin moving a KR banner to US',
  );

  await updateDoc(doc(superAdmin.db, 'banner_ads', 'us-banner'), {
    country_code: 'KR',
  });
  const movedBySuperAdmin = await getDoc(
    doc(superAdmin.db, 'banner_ads', 'us-banner'),
  );
  assert.equal(movedBySuperAdmin.data()?.country_code, 'KR');

  console.log('Firestore banner scope checks passed.');
} finally {
  await Promise.all([
    closeClient(regionAdmin),
    closeClient(countryAdmin),
    closeClient(superAdmin),
  ]);
}
