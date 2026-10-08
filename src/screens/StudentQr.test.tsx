import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SessionProvider } from '../app/Session';
import App from '../app/App';
import { localDataSource } from '../data/local';

it('카메라 스캔 없이 캡처 업로드 버튼만 보여준다', async () => {
  const future = { v7_startTransition: true, v7_relativeSplatPath: true } as const;
  render(
    <MemoryRouter initialEntries={['/verify/student/qr']} future={future}>
      <SessionProvider source={Promise.resolve(localDataSource)}>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );

  expect(await screen.findByText('캡처 이미지 올리기')).toBeTruthy();
  expect(screen.queryByText('카메라로 스캔하기')).toBeNull();
});
