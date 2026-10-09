#!/usr/bin/env node
// KOPIS OpenAPI v5 공식 개발가이드(2026-04-23 배포) 기준입니다.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { expandDtGuidance } from './kopis-time.mjs';
import { loadEnv, connectFirebase } from './lib/firebase.mjs';

const ROOT = resolve(import.meta.dirname, '..'),
  CACHE = resolve(import.meta.dirname, '.kopis-venue.json'),
  BASE = 'https://www.kopis.or.kr/openApi/restful';
const decode = (value) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
const tag = (xml, name) =>
  decode(xml.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`))?.[1] || '');
const records = (xml) => [...xml.matchAll(/<db>([\s\S]*?)<\/db>/g)].map((match) => match[1]);
const ymd = (date) =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
const dotted = (date) => `${date.slice(0, 4)}.${date.slice(4, 6)}.${date.slice(6, 8)}`;
const eventId = (kopisId, startsAt, index) =>
  index === 0 ? kopisId : `${kopisId}_${startsAt.slice(0, 16).replace(/\D/g, '')}`;
const toHttps = (url) => url.replace(/^http:\/\/www\.kopis\.or\.kr/, 'https://www.kopis.or.kr');

async function api(path, params, key) {
  const url = new URL(`${BASE}${path}`);
  url.search = new URLSearchParams({ ...params, service: key }).toString();
  const response = await fetch(url);
  if (!response.ok) throw new Error(`KOPIS 요청 실패: ${response.status} ${url.pathname}`);
  const xml = await response.text();
  const code = tag(xml, 'resultcode');
  if (code && code !== '00') throw new Error(`KOPIS 오류 ${code}: ${tag(xml, 'resultmsg')}`);
  return xml;
}
async function venueId(key) {
  if (existsSync(CACHE)) return JSON.parse(await readFile(CACHE, 'utf8')).mt10id;
  const xml = await api('/prfplc', { cpage: '1', rows: '100', shprfnmfct: '동해문화예술관' }, key);
  const candidates = records(xml).map((row) => ({
    mt10id: tag(row, 'mt10id'),
    name: tag(row, 'fcltynm'),
  }));
  const venue = candidates.find((item) => item.name.includes('동해문화예술관'));
  if (!venue) throw new Error('KOPIS에서 동해문화예술관 시설코드를 찾지 못했어요.');
  await writeFile(CACHE, JSON.stringify({ ...venue, cachedAt: new Date().toISOString() }, null, 2));
  return venue.mt10id;
}
async function performances(key, mt10id, start, end) {
  const found = [];
  for (let page = 1; ; page++) {
    const xml = await api(
      '/pblprfr',
      {
        stdate: start,
        eddate: end,
        cpage: String(page),
        rows: '100',
        prfplccd: mt10id,
        shprfnmfct: '동해문화예술관',
      },
      key,
    );
    const pageRows = records(xml);
    found.push(
      ...pageRows.map((row) => ({
        kopisId: tag(row, 'mt20id'),
        title: tag(row, 'prfnm'),
        from: tag(row, 'prfpdfrom'),
        to: tag(row, 'prfpdto'),
        poster: tag(row, 'poster'),
      })),
    );
    if (pageRows.length < 100) break;
  }
  return found;
}
async function toEvents(item, key) {
  const xml = await api(`/pblprfr/${encodeURIComponent(item.kopisId)}`, {}, key),
    detail = records(xml)[0] || xml,
    from = tag(detail, 'prfpdfrom') || item.from,
    to = tag(detail, 'prfpdto') || item.to,
    guidance = tag(detail, 'dtguidance'),
    hall = tag(detail, 'fcltynm'),
    poster = tag(detail, 'poster') || item.poster;
  const sessions = expandDtGuidance(from, to, guidance);
  if (!sessions.length) {
    console.warn(
      `[경고] ${item.kopisId} ${item.title}: dtguidance 해석 실패(${guidance || '비어 있음'}), 시작 날짜만 저장합니다.`,
    );
    sessions.push(`${from.replace(/\./g, '-')}T00:00:00+09:00`);
  }
  return sessions.map((startsAt, index) => ({
    id: eventId(item.kopisId, startsAt, index),
    venue: 'donghae',
    title: item.title,
    startsAt,
    hall: hall || undefined,
    kopisId: item.kopisId,
    poster: poster ? toHttps(poster) : undefined,
  }));
}
async function uploadFirebase(events, env) {
  const { db, firestore } = await connectFirebase(env);
  await Promise.all(
    events.map(({ id, ...event }) =>
      firestore.setDoc(firestore.doc(db, 'events', id), event, { merge: true }),
    ),
  );
}

async function main() {
  const env = { ...(await loadEnv(ROOT)), ...process.env },
    args = process.argv.slice(2),
    days = Number(args[args.indexOf('--days') + 1] || 30),
    outArg = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'seed/events.json',
    out = resolve(ROOT, outArg);
  if (!env.KOPIS_SERVICE_KEY) {
    console.log(
      '사용법: .env.local에 KOPIS_SERVICE_KEY를 넣고 node scripts/kopis-sync.mjs [--days 30] [--out seed/events.json] [--firebase]',
    );
    return;
  }
  if (!Number.isInteger(days) || days < 1 || days > 31)
    throw new Error('--days는 KOPIS 제한에 맞춰 1~31 사이 정수여야 합니다.');
  const start = new Date(),
    end = new Date(start);
  end.setDate(end.getDate() + days);
  const mt10id = await venueId(env.KOPIS_SERVICE_KEY),
    items = await performances(env.KOPIS_SERVICE_KEY, mt10id, ymd(start), ymd(end)),
    expanded = (await Promise.all(items.map((item) => toEvents(item, env.KOPIS_SERVICE_KEY))))
      .flat()
      .filter(
        (event) =>
          event.startsAt.slice(0, 10) >= dotted(ymd(start)).replace(/\./g, '-') &&
          event.startsAt.slice(0, 10) <= dotted(ymd(end)).replace(/\./g, '-'),
      );
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(expanded, null, 2));
  if (args.includes('--firebase')) await uploadFirebase(expanded, env);
  console.log(
    `${expanded.length}개 공연 회차를 ${outArg}${args.includes('--firebase') ? ' 및 Firestore' : ''}에 저장했습니다.`,
  );
}

main()
  .then(() => process.exit(0)) // Firebase SDK가 연결을 유지해 이벤트 루프가 안 끝나므로 명시 종료
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
