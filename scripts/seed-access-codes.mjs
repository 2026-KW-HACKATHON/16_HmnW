// 체험용·스태프용 인증 코드를 Firestore accessCodes에 넣는다.
// 사용법: node scripts/seed-access-codes.mjs | node scripts/seed-access-codes.mjs --remove
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { connectFirebase, loadEnv } from './lib/firebase.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const codes = {
  KW2026: {
    label: '체험 · 광운대 학생',
    grant: 'student',
    college: '인공지능융합대학',
    active: true,
  },
  VISIT2026: {
    label: '체험 · 공연장 방문객',
    grant: 'visitor',
    venue: 'donghae',
    hours: 24,
    active: true,
  },
  'DONGHAE-STAFF': {
    label: '동해문화예술관 스태프',
    grant: 'visitor',
    venue: 'donghae',
    hours: 12,
    active: true,
  },
};

const env = await loadEnv(root);
const { db, firestore } = await connectFirebase(env, 'seed-access-codes');
const remove = process.argv.includes('--remove');

for (const [code, data] of Object.entries(codes)) {
  const ref = firestore.doc(db, 'accessCodes', code);
  if (remove) await firestore.deleteDoc(ref);
  else await firestore.setDoc(ref, data, { merge: true });
  console.log(`${code} ${remove ? '삭제' : '저장'}`);
}
process.exit(0);
