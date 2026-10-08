import { initializeApp } from 'firebase/app';
import {
  EmailAuthProvider,
  getAuth,
  linkWithCredential,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  setDoc,
  type Query,
  updateDoc,
  where,
} from 'firebase/firestore';
import partners from '../../seed/partners.sample.json';
import eventsSeed from '../../seed/events.json';
import { redemptionId } from '../lib/redemption';
import { accessCodeCandidates, semesterEnd, validateAccessCode } from './accessCodes';
import type { DataSource } from './index';
import type { AccessCode, Coupon, EventDoc, Redemption, Shop, UserDoc } from './types';
export const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
});
const auth = getAuth(app);
let db;
try {
  // 무대 Wi-Fi가 끊겨도 마지막으로 받은 데이터를 보여주기 위한 오프라인 캐시(미지원 브라우저는 메모리 캐시로 폴백)
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch {
  db = initializeFirestore(app, { ignoreUndefinedProperties: true });
}
const sub = <T>(q: Query, cb: (v: T[]) => void, onError?: (error: unknown) => void) =>
  onSnapshot(q, (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }) as T)), onError);
export const firebaseDataSource: DataSource = {
  mode: 'firebase',
  auth: {
    async anonymous() {
      if (auth.currentUser) return { uid: auth.currentUser.uid, email: auth.currentUser.email };
      const r = await signInAnonymously(auth);
      return { uid: r.user.uid, email: r.user.email };
    },
    async owner(email, password, create) {
      let user;
      if (create && auth.currentUser?.isAnonymous) {
        try {
          user = (
            await linkWithCredential(
              auth.currentUser,
              EmailAuthProvider.credential(email, password),
            )
          ).user;
        } catch (error) {
          const code = (error as { code?: string }).code;
          if (
            code !== 'auth/email-already-in-use' &&
            code !== 'auth/credential-already-in-use' &&
            code !== 'auth/provider-already-linked'
          )
            throw error;
          user = (await signInWithEmailAndPassword(auth, email, password)).user;
        }
      } else user = (await signInWithEmailAndPassword(auth, email, password)).user;
      await setDoc(
        doc(db, 'users', user.uid),
        { role: 'owner', createdAt: new Date().toISOString() },
        { merge: true },
      );
      return { uid: user.uid, email: user.email };
    },
    async signOut() {
      await signOut(auth);
    },
  },
  users: {
    async get(uid) {
      const s = await getDoc(doc(db, 'users', uid));
      return s.exists() ? ({ id: s.id, ...s.data() } as UserDoc) : null;
    },
    async update(uid, data) {
      await setDoc(doc(db, 'users', uid), data, { merge: true });
    },
  },
  students: {
    async claim(studentNoHash, uid) {
      try {
        await setDoc(doc(db, 'studentNos', studentNoHash), {
          uid,
          claimedAt: new Date().toISOString(),
        });
      } catch (error) {
        if ((error as { code?: string })?.code === 'permission-denied')
          throw { code: 'already-claimed' };
        throw error;
      }
    },
  },
  accessCodes: {
    async redeem(code) {
      if (!auth.currentUser) throw { code: 'network-error' };
      let accessCode: AccessCode | null = null;
      for (const candidate of accessCodeCandidates(code)) {
        const snapshot = await getDoc(doc(db, 'accessCodes', candidate));
        if (snapshot.exists()) {
          accessCode = snapshot.data() as AccessCode;
          break;
        }
      }
      if (!accessCode) throw { code: 'invalid-code' };
      validateAccessCode(accessCode);
      const now = new Date();
      const qualification =
        accessCode.grant === 'student'
          ? {
              student: {
                method: 'code' as const,
                studentNoMasked: '체험',
                college: accessCode.college || '',
                clubs: [],
                verifiedAt: now.toISOString(),
                expiresAt: semesterEnd(now),
              },
            }
          : {
              visitor: {
                venue: accessCode.venue || ('donghae' as const),
                verifiedAt: now.toISOString(),
                expiresAt: new Date(
                  now.getTime() + (accessCode.hours ?? 24) * 3_600_000,
                ).toISOString(),
              },
            };
      await setDoc(doc(db, 'users', auth.currentUser.uid), qualification, { merge: true });
      return { label: accessCode.label, grant: accessCode.grant };
    },
  },
  shops: {
    subscribe: (cb, onError) => sub<Shop>(collection(db, 'shops'), cb, onError),
    async create(v) {
      return (await addDoc(collection(db, 'shops'), v)).id;
    },
    async update(id, v) {
      await updateDoc(doc(db, 'shops', id), v);
    },
  },
  coupons: {
    subscribe: (cb, onError) => sub<Coupon>(collection(db, 'coupons'), cb, onError),
    async create(v) {
      return (await addDoc(collection(db, 'coupons'), v)).id;
    },
    async update(id, v) {
      await updateDoc(doc(db, 'coupons', id), v);
    },
  },
  events: {
    subscribe: (cb, onError) => sub<EventDoc>(collection(db, 'events'), cb, onError),
    async addEvents(items) {
      await Promise.all(
        items.map((x) =>
          setDoc(
            doc(db, 'events', x.id),
            Object.fromEntries(Object.entries(x).filter(([k]) => k !== 'id')),
            { merge: true },
          ),
        ),
      );
    },
  },
  redemptions: {
    async create(v, limit) {
      const { verificationAt, ...rest } = v;
      const id = redemptionId(v.uid, { id: v.couponId, limit }, v.dayKey, verificationAt);
      try {
        await setDoc(doc(db, 'redemptions', id), verificationAt ? v : rest);
      } catch (error) {
        if ((error as { code?: string })?.code === 'permission-denied')
          throw { code: 'already-redeemed' };
        throw error;
      }
      return id;
    },
    // 규칙(read: resource.data.uid == auth.uid)을 만족하려면 uid 필터가 반드시 있어야 합니다.
    subscribe: (uid, cb, onError) =>
      sub<Redemption>(
        query(collection(db, 'redemptions'), where('uid', '==', uid)),
        cb,
        (error) => {
          // 익명 → 사장님 전환 직후, 이전 uid 구독이 새 토큰으로 재평가되며 permission-denied가 한 번 옵니다. 더 이상 내 uid가 아니면 무시합니다.
          if (auth.currentUser && auth.currentUser.uid !== uid) return;
          onError?.(error);
        },
      ),
    // 규칙(read: ownsShop(resource.data.shopId))을 만족하려면 shopId 필터가 반드시 있어야 합니다.
    subscribeByShop: (shopId, cb, onError) =>
      sub<Redemption>(
        query(collection(db, 'redemptions'), where('shopId', '==', shopId)),
        cb,
        onError,
      ),
    async query(uid, shopIds) {
      if (shopIds?.length) {
        const snapshots = await Promise.all(
          shopIds.map((shopId) =>
            getDocs(query(collection(db, 'redemptions'), where('shopId', '==', shopId))),
          ),
        );
        return snapshots.flatMap((snapshot) =>
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Redemption),
        );
      }
      const q = uid
        ? query(collection(db, 'redemptions'), where('uid', '==', uid))
        : collection(db, 'redemptions');
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Redemption);
    },
  },
  async seed() {
    await Promise.all(
      [
        (partners.shops as Shop[]).map((x) =>
          setDoc(
            doc(db, 'shops', x.id),
            Object.fromEntries(Object.entries(x).filter(([k]) => k !== 'id')),
          ),
        ),
        (partners.coupons as Coupon[]).map((x) =>
          setDoc(
            doc(db, 'coupons', x.id),
            Object.fromEntries(Object.entries(x).filter(([k]) => k !== 'id')),
          ),
        ),
        (eventsSeed as EventDoc[]).map((x) =>
          setDoc(
            doc(db, 'events', x.id),
            Object.fromEntries(Object.entries(x).filter(([k]) => k !== 'id')),
          ),
        ),
      ].flat(),
    );
  },
};
