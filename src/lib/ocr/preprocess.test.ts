import { expect, it } from 'vitest';
import { brightBox } from './preprocess';

it('가운데 밝은 사각형이 있는 합성 배열에서 박스를 검출한다', () => {
  const W = 100;
  const H = 100;
  const lum = new Uint8Array(W * H).fill(0);
  for (let y = 20; y <= 79; y += 1) {
    for (let x = 20; x <= 79; x += 1) {
      lum[y * W + x] = 255;
    }
  }
  expect(brightBox(lum, W, H)).toEqual({ x: 12, y: 12, w: 76, h: 76 });
});

it('전체가 어두우면 null을 돌려준다', () => {
  const W = 50;
  const H = 50;
  const lum = new Uint8Array(W * H).fill(0);
  expect(brightBox(lum, W, H)).toBeNull();
});
