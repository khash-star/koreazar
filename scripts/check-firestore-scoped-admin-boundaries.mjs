import assert from 'node:assert/strict';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  terminate,
  updateDoc,
} from 'firebase/firestore';

const projectId = 'demo-koreazar-scoped-admin-boundaries';
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
  seedDocument('users/participant-a', {
    role: { stringValue: 'user' },
    email: { stringValue: 'participant-a@example.com' },
  }),
  seedDocument('users/reporter', {
    role: { stringValue: 'user' },
    email: { stringValue: 'reporter@example.com' },
  }),
  seedDocument('users/target-user', {
    role: { stringValue: 'user' },
    email: { stringValue: 'target@example.com' },
    display_name: { stringValue: 'Target user' },
  }),
  seedDocument('banner_requests/kr-request', {
    created_by: { stringValue: 'requester@example.com' },
    status: { stringValue: 'pending' },
    title: { stringValue: 'KR request' },
  }),
  seedDocument('listing_reports/kr-report', {
    listing_id: { stringValue: 'kr-listing' },
    reporter_uid: { stringValue: 'reporter' },
    reporter_email: { stringValue: 'reporter@example.com' },
    status: { stringValue: 'pending' },
  }),
  seedDocument('conversations/kr-conversation', {
    participant_uids: {
      arrayValue: {
        values: [
          { stringValue: 'participant-a' },
          { stringValue: 'participant-b' },
        ],
      },
    },
    participant_1: { stringValue: 'participant-a@example.com' },
    participant_2: { stringValue: 'participant-b@example.com' },
    last_message: { stringValue: 'Private conversation' },
  }),
  seedDocument('messages/kr-message', {
    conversation_id: { stringValue: 'kr-conversation' },
    sender_email: { stringValue: 'participant-a@example.com' },
    receiver_email: { stringValue: 'participant-b@example.com' },
    is_read: { booleanValue: false },
  }),
  seedDocument('listings/us-dc-listing', {
    country_code: { stringValue: 'US' },
    region_code: { stringValue: 'washington-dc' },
    created_by: { stringValue: 'seller@example.com' },
    title: { stringValue: 'DC listing' },
  }),
  seedDocument('banner_ads/us-banner', {
    country_code: { stringValue: 'US' },
    title: { stringValue: 'US banner' },
    is_active: { booleanValue: true },
  }),
]);

const regionAdmin = createClient('region-admin', 'region@example.com');
const countryAdmin = createClient('country-admin', 'country@example.com');
const superAdmin = createClient('super-admin', 'super@example.com');
const participant = createClient('participant-a', 'participant-a@example.com');
const reporter = createClient('reporter', 'reporter@example.com');
const targetUser = createClient('target-user', 'target@example.com');

try {
  await expectDenied(
    updateDoc(doc(countryAdmin.db, 'users', 'target-user'), {
      display_name: 'Cross-market overwrite',
    }),
    'country admin updating another user profile',
  );
  await expectDenied(
    updateDoc(doc(regionAdmin.db, 'banner_requests', 'kr-request'), {
      status: 'rejected',
    }),
    'region admin mutating a banner request without enforceable scope',
  );
  await expectDenied(
    getDoc(doc(regionAdmin.db, 'listing_reports', 'kr-report')),
    'region admin reading an out-of-scope listing report',
  );
  await expectDenied(
    updateDoc(doc(regionAdmin.db, 'listing_reports', 'kr-report'), {
      status: 'rejected',
    }),
    'region admin mutating an out-of-scope listing report',
  );
  await expectDenied(
    getDoc(doc(regionAdmin.db, 'conversations', 'kr-conversation')),
    'region admin reading a private conversation',
  );
  await expectDenied(
    updateDoc(doc(regionAdmin.db, 'conversations', 'kr-conversation'), {
      last_message: 'Tampered',
    }),
    'region admin mutating a private conversation',
  );
  await expectDenied(
    deleteDoc(doc(regionAdmin.db, 'conversations', 'kr-conversation')),
    'region admin deleting a private conversation',
  );
  await expectDenied(
    updateDoc(doc(regionAdmin.db, 'messages', 'kr-message'), {
      is_read: true,
    }),
    'region admin mutating a private message',
  );
  await expectDenied(
    deleteDoc(doc(regionAdmin.db, 'messages', 'kr-message')),
    'region admin deleting a private message',
  );

  await updateDoc(doc(targetUser.db, 'users', 'target-user'), {
    display_name: 'Owner update',
  });
  assert.equal(
    (await getDoc(doc(reporter.db, 'listing_reports', 'kr-report'))).data()?.status,
    'pending',
  );
  await updateDoc(doc(participant.db, 'conversations', 'kr-conversation'), {
    last_message: 'Participant update',
  });
  await updateDoc(doc(participant.db, 'messages', 'kr-message'), {
    is_read: true,
  });

  await updateDoc(doc(regionAdmin.db, 'listings', 'us-dc-listing'), {
    title: 'Scoped admin listing update',
  });
  await updateDoc(doc(regionAdmin.db, 'banner_ads', 'us-banner'), {
    title: 'Scoped admin banner update',
  });

  await updateDoc(doc(superAdmin.db, 'users', 'target-user'), {
    display_name: 'Super admin update',
  });
  await updateDoc(doc(superAdmin.db, 'banner_requests', 'kr-request'), {
    status: 'approved',
  });
  await updateDoc(doc(superAdmin.db, 'listing_reports', 'kr-report'), {
    status: 'reviewed',
  });
  await updateDoc(doc(superAdmin.db, 'conversations', 'kr-conversation'), {
    last_message: 'Super admin update',
  });
  await updateDoc(doc(superAdmin.db, 'messages', 'kr-message'), {
    is_read: false,
  });

  console.log('Firestore scoped-admin boundary checks passed.');
} finally {
  await Promise.all([
    closeClient(regionAdmin),
    closeClient(countryAdmin),
    closeClient(superAdmin),
    closeClient(participant),
    closeClient(reporter),
    closeClient(targetUser),
  ]);
}
