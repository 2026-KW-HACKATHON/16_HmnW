// 발표용 데모 공연을 Firestore events에 넣는다(운영 봇 계정 필요: .env.local의 SEED_ADMIN_*).
// 사용법: node scripts/seed-demo-events.mjs --date 2026-10-09   (해당 날짜를 '오늘'로 보고 오늘·내일 회차 생성)
//        node scripts/seed-demo-events.mjs --remove             (demo- 접두 문서 삭제)
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEnv, connectFirebase } from './lib/firebase.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dateArg = args[args.indexOf('--date') + 1];
const today = args.includes('--date') && dateArg ? dateArg : new Date().toLocaleDateString('sv');
const tomorrow = new Date(`${today}T12:00:00+09:00`);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowKey = tomorrow.toLocaleDateString('sv', { timeZone: 'Asia/Seoul' });

const env = await loadEnv(root);
const { db, firestore } = await connectFirebase(env, 'seed-demo-events');
const col = firestore.collection(db, 'events');

if (args.includes('--remove')) {
  const snap = await firestore.getDocs(col);
  let n = 0;
  for (const d of snap.docs) if (d.id.startsWith('demo-')) { await firestore.deleteDoc(d.ref); n++; }
  console.log(`demo 공연 ${n}개 삭제`);
  process.exit(0);
}

const sample = JSON.parse(await readFile(join(root, 'seed/events.sample.json'), 'utf8'));
let n = 0;
for (const e of sample) {
  const day = e.id.includes('tomorrow') ? tomorrowKey : today;
  const time = e.startsAt.slice(11, 19);
  const doc = { ...e, id: `demo-${e.id}`, startsAt: `${day}T${time}+09:00` };
  await firestore.setDoc(firestore.doc(col, doc.id), doc);
  console.log(doc.id, doc.title, doc.startsAt);
  n++;
}
console.log(`demo 공연 ${n}개 저장 (오늘=${today}, 내일=${tomorrowKey})`);
process.exit(0);
