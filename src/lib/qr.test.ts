import jsQR from 'jsqr';
import { expect, it, vi } from 'vitest';
import { decodeQrImage, makeDemoQr, parseDemoQr } from './qr';

vi.mock('jsqr', () => ({ default: vi.fn(() => ({ data: 'decoded-value' })) }));

it('데모 QR을 생성하고 HMAC을 검증해 다시 읽는다', async () => {
  const value = await makeDemoQr(
    '2026123456',
    '홍길동',
    '공과대학',
    new Date('2026-10-08T00:00:00Z'),
  );
  expect(value).toMatch(/^KW1\|2026123456\|홍길동\|공과대학\|/);
  await expect(parseDemoQr(value)).resolves.toMatchObject({
    studentNo: '2026123456',
    name: '홍길동',
    college: '공과대학',
  });
});

it('캡처 이미지를 캔버스에 그려 jsQR로 디코드한다', async () => {
  const bitmap = { width: 100, height: 80, close: vi.fn() } as unknown as ImageBitmap;
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => bitmap),
  );
  const context = {
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
  };
  vi.spyOn(document, 'createElement').mockReturnValue({
    width: 0,
    height: 0,
    getContext: () => context,
  } as unknown as HTMLCanvasElement);
  await expect(decodeQrImage(new Blob())).resolves.toBe('decoded-value');
  expect(jsQR).toHaveBeenCalledWith(expect.any(Uint8ClampedArray), 100, 80);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('변조된 데모 QR을 거부한다', async () => {
  const value = await makeDemoQr('2026123456', '홍길동', '공과대학');
  await expect(parseDemoQr(value.replace('홍길동', '김길동'))).rejects.toThrow('서명');
});
