import { expect, it } from 'vitest';
import { sha256Hex } from './hash';

it('SHA-256 hex를 계산한다', async () => {
  expect(await sha256Hex('abc')).toBe(
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  );
});

it('같은 입력은 같은 해시, 다른 입력은 다른 해시를 낸다', async () => {
  expect(await sha256Hex('1234')).toBe(await sha256Hex('1234'));
  expect(await sha256Hex('1234')).not.toBe(await sha256Hex('4321'));
});
