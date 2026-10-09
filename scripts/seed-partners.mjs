#!/usr/bin/env node
// seed/partners.sample.json(shops[]+coupons[])을 검증하고, --firebase 시 Firestore에 upsert합니다.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadEnv, connectFirebase } from './lib/firebase.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const AREAS = ['main_gate', 'back_gate', 'station', 'uicheon'];
const AUDIENCE_TYPES = ['all', 'student', 'visitor'];
const VENUES = ['donghae', 'icerink'];
const LIMITS = ['once_per_day', 'once_per_verification', 'unlimited'];

const isStr = (v) => typeof v === 'string';
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isStrArr = (v) => Array.isArray(v) && v.every(isStr);

function validateShop(shop, index, errors) {
  const where = `shops[${index}]`;
  if (!isStr(shop.id)) errors.push(`${where}.id는 문자열이어야 합니다.`);
  if (!isStr(shop.ownerUid)) errors.push(`${where}.ownerUid는 문자열이어야 합니다.`);
  if (!isStr(shop.name)) errors.push(`${where}.name은 문자열이어야 합니다.`);
  if (!isStr(shop.category)) errors.push(`${where}.category는 문자열이어야 합니다.`);
  if (!AREAS.includes(shop.area))
    errors.push(`${where}.area는 ${AREAS.join('|')} 중 하나여야 합니다.`);
  if (!isStr(shop.address)) errors.push(`${where}.address는 문자열이어야 합니다.`);
  if (!isNum(shop.lat)) errors.push(`${where}.lat은 숫자여야 합니다.`);
  if (!isNum(shop.lng)) errors.push(`${where}.lng은 숫자여야 합니다.`);
  if (shop.phone !== undefined && !isStr(shop.phone))
    errors.push(`${where}.phone은 문자열이어야 합니다.`);
  if (shop.hours !== undefined && !isStr(shop.hours))
    errors.push(`${where}.hours는 문자열이어야 합니다.`);
  if (shop.photoDataUrl !== undefined && !isStr(shop.photoDataUrl))
    errors.push(`${where}.photoDataUrl은 문자열이어야 합니다.`);
  if (shop.pinHash !== undefined && !isStr(shop.pinHash))
    errors.push(`${where}.pinHash는 문자열이어야 합니다.`);
  if (!isStr(shop.createdAt)) errors.push(`${where}.createdAt은 문자열이어야 합니다.`);
}

function validateCoupon(coupon, index, shopIds, errors) {
  const where = `coupons[${index}]`;
  if (!isStr(coupon.id)) errors.push(`${where}.id는 문자열이어야 합니다.`);
  if (!isStr(coupon.shopId)) errors.push(`${where}.shopId는 문자열이어야 합니다.`);
  else if (!shopIds.has(coupon.shopId))
    errors.push(`${where}.shopId(${coupon.shopId})가 shops에 없습니다.`);
  if (!isStr(coupon.title)) errors.push(`${where}.title은 문자열이어야 합니다.`);
  if (coupon.desc !== undefined && !isStr(coupon.desc))
    errors.push(`${where}.desc는 문자열이어야 합니다.`);
  const audience = coupon.audience;
  if (!audience || !AUDIENCE_TYPES.includes(audience.type))
    errors.push(`${where}.audience.type은 ${AUDIENCE_TYPES.join('|')} 중 하나여야 합니다.`);
  else {
    if (audience.colleges !== undefined && !isStrArr(audience.colleges))
      errors.push(`${where}.audience.colleges는 문자열 배열이어야 합니다.`);
    if (audience.clubs !== undefined && !isStrArr(audience.clubs))
      errors.push(`${where}.audience.clubs는 문자열 배열이어야 합니다.`);
    if (
      audience.venues !== undefined &&
      (!Array.isArray(audience.venues) || !audience.venues.every((v) => VENUES.includes(v)))
    )
      errors.push(`${where}.audience.venues는 ${VENUES.join('|')} 배열이어야 합니다.`);
  }
  const days = coupon.days;
  if (!(
    days === 'all' ||
    days === 'weekday' ||
    days === 'weekend' ||
    (Array.isArray(days) && days.every((d) => typeof d === 'number'))
  ))
    errors.push(`${where}.days는 all|weekday|weekend 또는 숫자 배열이어야 합니다.`);
  if (!isStr(coupon.timeFrom)) errors.push(`${where}.timeFrom은 문자열이어야 합니다.`);
  if (!isStr(coupon.timeTo)) errors.push(`${where}.timeTo는 문자열이어야 합니다.`);
  if (coupon.validFrom !== undefined && !isStr(coupon.validFrom))
    errors.push(`${where}.validFrom은 문자열이어야 합니다.`);
  if (coupon.validTo !== undefined && !isStr(coupon.validTo))
    errors.push(`${where}.validTo는 문자열이어야 합니다.`);
  if (!LIMITS.includes(coupon.limit))
    errors.push(`${where}.limit은 ${LIMITS.join('|')} 중 하나여야 합니다.`);
  if (typeof coupon.active !== 'boolean') errors.push(`${where}.active는 boolean이어야 합니다.`);
  if (!isStr(coupon.createdAt)) errors.push(`${where}.createdAt은 문자열이어야 합니다.`);
}

function validate(json) {
  const errors = [];
  if (!Array.isArray(json.shops)) errors.push('shops는 배열이어야 합니다.');
  if (!Array.isArray(json.coupons)) errors.push('coupons는 배열이어야 합니다.');
  if (errors.length) return errors;
  json.shops.forEach((shop, index) => validateShop(shop, index, errors));
  const shopIds = new Set(json.shops.map((shop) => shop.id));
  json.coupons.forEach((coupon, index) => validateCoupon(coupon, index, shopIds, errors));
  return errors;
}

async function replaceSeeded(db, firestore) {
  for (const name of ['shops', 'coupons']) {
    const snapshot = await firestore.getDocs(
      firestore.query(firestore.collection(db, name), firestore.where('ownerUid', '==', 'seed')),
    );
    await Promise.all(snapshot.docs.map((d) => firestore.deleteDoc(d.ref)));
  }
}

async function uploadFirebase(json, env, replace) {
  const { db, firestore } = await connectFirebase(env);
  if (replace) await replaceSeeded(db, firestore);
  await Promise.all([
    ...json.shops.map(({ id, ...shop }) =>
      firestore.setDoc(firestore.doc(db, 'shops', id), shop, { merge: true }),
    ),
    ...json.coupons.map(({ id, ...coupon }) =>
      firestore.setDoc(
        firestore.doc(db, 'coupons', id),
        { ...coupon, ownerUid: 'seed' },
        { merge: true },
      ),
    ),
  ]);
}

async function main() {
  const args = process.argv.slice(2),
    fileArg = args.includes('--file')
      ? args[args.indexOf('--file') + 1]
      : 'seed/partners.sample.json',
    file = resolve(ROOT, fileArg),
    json = JSON.parse(await readFile(file, 'utf8'));
  const errors = validate(json);
  if (errors.length)
    throw new Error(
      `${fileArg} 검증 실패 (${errors.length}건):\n${errors.map((e) => `- ${e}`).join('\n')}`,
    );
  console.log(`${fileArg} 검증 통과: 가게 ${json.shops.length}곳, 혜택 ${json.coupons.length}개.`);
  if (!args.includes('--firebase')) return;
  const env = { ...(await loadEnv(ROOT)), ...process.env },
    replace = args.includes('--replace');
  await uploadFirebase(json, env, replace);
  console.log(
    `Firestore에 가게 ${json.shops.length}곳, 혜택 ${json.coupons.length}개를 업로드했습니다.${replace ? ' (ownerUid=seed 문서 교체)' : ''}`,
  );
}

main()
  .then(() => process.exit(0)) // Firebase SDK가 연결을 유지해 이벤트 루프가 안 끝나므로 명시 종료
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
