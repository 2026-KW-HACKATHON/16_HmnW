import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SessionProvider } from '../app/Session';
import App from '../app/App';
import { localDataSource } from '../data/local';

const geminiStudentCard = vi.fn();
const recognizeImageMulti = vi.fn();

vi.mock('../lib/ocr/gemini', () => ({
  geminiStudentCard: (...args: unknown[]) => geminiStudentCard(...args),
}));
vi.mock('../lib/ocr/preprocess', () => ({
  preprocessImage: vi.fn(async (file: Blob) => file),
}));
vi.mock('../lib/ocr/worker', () => ({
  recognizeImageMulti: (...args: unknown[]) => recognizeImageMulti(...args),
}));

beforeEach(() => {
  localStorage.clear();
  geminiStudentCard.mockReset();
  recognizeImageMulti.mockReset();
  vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:preview') });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('Gemini가 실패하면 같은 사진을 Tesseract로 읽고 전환 안내를 표시한다', async () => {
  localStorage.setItem('presentation', '1');
  geminiStudentCard.mockRejectedValueOnce(
    Object.assign(new Error('gemini-unavailable'), { code: 'gemini-unavailable' }),
  );
  recognizeImageMulti.mockResolvedValueOnce({
    text: '광운대학교\n2026123456\n홍길동\n소프트웨어학부',
    texts: [],
  });
  const future = { v7_startTransition: true, v7_relativeSplatPath: true } as const;
  const { container } = render(
    <MemoryRouter initialEntries={['/verify/student/card']} future={future}>
      <SessionProvider source={Promise.resolve(localDataSource)}>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );

  await screen.findByText('학생증을 찍어 주세요');
  const file = new File(['student-card'], 'student.jpg', { type: 'image/jpeg' });
  fireEvent.change(container.querySelector('input[type="file"]')!, {
    target: { files: [file] },
  });

  await waitFor(() => expect(recognizeImageMulti).toHaveBeenCalledTimes(1));
  expect(await screen.findByText('읽은 내용을 확인해 주세요')).toBeTruthy();
});

it('라이브 스캔이 꺼져 있으면 1단계에 촬영 UI를 보여주고 비발표 모드에서는 앨범 버튼을 숨긴다', async () => {
  const future = { v7_startTransition: true, v7_relativeSplatPath: true } as const;
  render(
    <MemoryRouter initialEntries={['/verify/student/card']} future={future}>
      <SessionProvider source={Promise.resolve(localDataSource)}>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );

  expect(await screen.findByText('학생증을 찍어 주세요')).toBeTruthy();
  expect(await screen.findByText('학생증 촬영하기')).toBeTruthy();
  expect(screen.queryByText('앨범에서 고르기')).toBeNull();
});

it('촬영 안내에 세로 촬영을 권장하는 문구를 보여준다', async () => {
  const future = { v7_startTransition: true, v7_relativeSplatPath: true } as const;
  render(
    <MemoryRouter initialEntries={['/verify/student/card']} future={future}>
      <SessionProvider source={Promise.resolve(localDataSource)}>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );

  expect(await screen.findByText('세로로 찍으면 더 잘 읽혀요')).toBeTruthy();
});
