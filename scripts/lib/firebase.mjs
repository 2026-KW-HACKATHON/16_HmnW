import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export async function loadEnv(root) {
  const file = resolve(root, '.env.local');
  if (!existsSync(file)) return {};
  const text = await readFile(file, 'utf8');
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const at = line.indexOf('=');
        return [
          line.slice(0, at),
          line
            .slice(at + 1)
            .trim()
            .replace(/^['"]|['"]$/g, ''),
        ];
      }),
  );
}

const REQUIRED_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
  'SEED_ADMIN_EMAIL',
  'SEED_ADMIN_PASSWORD',
];

export async function connectFirebase(env, flag = '--firebase') {
  for (const key of REQUIRED_KEYS)
    if (!env[key]) throw new Error(`${flag}에는 ${key}가 필요합니다.`);
  const [{ initializeApp }, auth, firestore] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ]);
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  });
  await auth.signInWithEmailAndPassword(
    auth.getAuth(app),
    env.SEED_ADMIN_EMAIL,
    env.SEED_ADMIN_PASSWORD,
  );
  return { db: firestore.getFirestore(app), firestore };
}
