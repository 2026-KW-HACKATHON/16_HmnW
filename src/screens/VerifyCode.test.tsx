import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SessionProvider } from '../app/Session';
import App from '../app/App';
import { localDataSource } from '../data/local';

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('인증 화면에 코드 인증 링크가 있다', async () => {
  render(
    <MemoryRouter initialEntries={['/verify']}>
      <SessionProvider source={Promise.resolve(localDataSource)}>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );

  const link = await screen.findByRole('link', { name: /코드로 인증하기/ });
  expect(link.getAttribute('href')).toBe('/verify/code');
});
