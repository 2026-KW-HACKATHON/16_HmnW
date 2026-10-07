import { useState } from 'react';
import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ClubPicker } from './ClubPicker';

function Harness() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <>
      <ClubPicker value={value} onChange={setValue} />
      <output data-testid="value">{value.join(',')}</output>
    </>
  );
}
afterEach(cleanup);

it('검색어로 동아리를 거르고 칩을 눌러 선택·해제한다', () => {
  render(<Harness />);
  expect(screen.getByText('노을')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('동아리 검색'), { target: { value: '검도' } });
  expect(screen.queryByText('노을')).toBeNull();
  const chip = screen.getByRole('button', { name: '검도부' });
  expect(chip.getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(chip);
  expect(screen.getByRole('button', { name: '검도부' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByTestId('value').textContent).toBe('검도부');
  fireEvent.click(screen.getByRole('button', { name: '검도부 선택 해제' }));
  expect(screen.getByTestId('value').textContent).toBe('');
  expect(screen.getByRole('button', { name: '검도부' }).getAttribute('aria-pressed')).toBe('false');
  expect(screen.queryByRole('button', { name: '검도부 선택 해제' })).toBeNull();
});
