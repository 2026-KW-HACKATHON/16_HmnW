import { beforeEach, expect, it, vi } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

it('익명 uid를 유지해 사장님으로 승격하고 가게·혜택·사용 기록을 공유한다', async () => {
  const { localDataSource: data } = await import('./local');
  const customer = await data.auth.anonymous();
  const owner = await data.auth.owner('owner@example.com', '123456', true);
  expect(owner.uid).toBe(customer.uid);
  expect((await data.users.get(owner.uid))?.role).toBe('owner');
  const shopId = await data.shops.create({
    ownerUid: owner.uid,
    name: '테스트 가게',
    category: '카페',
    area: 'main_gate',
    address: '서울',
    lat: 37.6,
    lng: 127.1,
    createdAt: new Date().toISOString(),
  });
  const couponId = await data.coupons.create({
    shopId,
    title: '테스트 혜택',
    audience: { type: 'all' },
    days: 'all',
    timeFrom: '00:00',
    timeTo: '00:00',
    limit: 'once_per_day',
    active: true,
    createdAt: new Date().toISOString(),
  });
  await data.redemptions.create(
    {
      uid: owner.uid,
      couponId,
      shopId,
      at: new Date().toISOString(),
      dayKey: '2026-10-08',
    },
    'once_per_day',
  );
  expect(await data.redemptions.query(owner.uid)).toHaveLength(1);
  expect(await data.redemptions.query(undefined, [shopId])).toHaveLength(1);
  await data.coupons.update(couponId, { active: false });
  let active = true;
  data.coupons.subscribe((items) => {
    active = items.find((x) => x.id === couponId)!.active;
  })();
  expect(active).toBe(false);
});

it('한 학번 해시는 한 계정만 claim할 수 있다', async () => {
  const { localDataSource: data } = await import('./local');
  await data.auth.anonymous();
  await data.students.claim('hash-1', 'uid-1');
  await expect(data.students.claim('hash-1', 'uid-2')).rejects.toEqual({
    code: 'already-claimed',
  });
});
