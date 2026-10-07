import { beforeEach, expect, it, vi } from 'vitest';

const createWorker = vi.fn(async () => ({ recognize: vi.fn() }));
vi.mock('tesseract.js', () => ({
  createWorker: (...args: Parameters<typeof createWorker>) => createWorker(...args),
}));

beforeEach(() => {
  vi.resetModules();
  createWorker.mockClear();
});

it('warmupOcr은 멱등이라 두 번 불러도 워커를 한 번만 만든다', async () => {
  const { warmupOcr } = await import('./worker');
  warmupOcr();
  warmupOcr();
  expect(createWorker).toHaveBeenCalledTimes(1);
});

it('warmupOcr은 실패해도 던지지 않는다', async () => {
  createWorker.mockRejectedValueOnce(new Error('network down'));
  const { warmupOcr } = await import('./worker');
  expect(() => warmupOcr()).not.toThrow();
});
