import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createLiveAccumulator,
  createStudentLiveAccumulator,
  startRinkReceiptLiveScan,
} from './live';

const recognize = vi.fn();
const setParameters = vi.fn();

vi.mock('./worker', () => ({
  ensureWorker: () => Promise.resolve({ recognize, setParameters }),
}));
vi.mock('./preprocess', () => ({
  preprocessCanvasSource: () => Promise.resolve(new Blob()),
}));

describe('일반 라이브 OCR 누적기', () => {
  it('최근 6프레임에서 필드별 다수결 값을 선택한다', () => {
    const acc = createLiveAccumulator<{ title: string; partySize: number }>({
      requiredKeys: ['title'],
    });
    acc.push({ title: '공연 A', partySize: 2 }, '첫 프레임');
    acc.push({ title: '공연 A', partySize: 3 }, '둘째 프레임');
    const state = acc.push({ title: '공연 B', partySize: 3 }, '마지막 프레임');

    expect(state.fields).toEqual({ title: '공연 A', partySize: 3 });
    expect(state.rawText).toBe('마지막 프레임');
  });

  it('모든 필수 필드의 같은 값이 2프레임 이상 잡혀야 확정한다', () => {
    const acc = createLiveAccumulator<{ title: string; dateTime: Date | null }>({
      requiredKeys: ['title', 'dateTime'],
    });
    expect(
      acc.push({ title: '케니 지 내한 공연', dateTime: new Date(2026, 9, 20, 20) }, '1').confirmed,
    ).toBe(false);
    expect(
      acc.push({ title: '케니 지 내한 공연', dateTime: new Date(2026, 9, 20, 20) }, '2').confirmed,
    ).toBe(true);
  });
});

describe('라이브 학생증 누적 인식', () => {
  it('기존 학교 토큰 조건을 유지한다', () => {
    const acc = createStudentLiveAccumulator();
    expect(
      acc.push({ studentNo: '2021123456', name: '', college: '' }, '광운대학교').confirmed,
    ).toBe(false);
    expect(
      acc.push({ studentNo: '2021123456', name: '홍길동', college: '' }, '학생증').confirmed,
    ).toBe(true);
  });
});

describe('아이스링크 영수증 라이브 인식', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    let frame = 0;
    recognize.mockImplementation(() =>
      Promise.resolve({
        data: {
          text:
            frame++ === 0
              ? '성인 2명 결제금액 12,000원 동해 아이스링크 영수증'
              : '동해 아이스링크 방문 영수증 항목을 확인해 주세요',
        },
      }),
    );
    setParameters.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('12초 안에 확정하지 못하면 최선값을 partial 결과로 반환한다', async () => {
    const video = document.createElement('video');
    Object.defineProperty(video, 'videoWidth', { configurable: true, value: 640 });
    video.play = vi.fn().mockResolvedValue(undefined);
    const onResult = vi.fn();

    await startRinkReceiptLiveScan(video, { onFrame: vi.fn(), onResult, onTimeout: vi.fn() });
    await vi.advanceTimersByTimeAsync(12_000);

    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 12000, partySize: 2 }),
      '동해 아이스링크 방문 영수증 항목을 확인해 주세요',
      true,
    );
  });
});
