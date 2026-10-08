import type { FormEvent, ReactNode } from 'react';
import type { Area, EventDoc, Venue } from '../data/types';
import { Button } from '../ui/Button';
import { AppBar } from '../ui/AppBar';
import { Stepper } from '../ui/Stepper';

export const areaName: Record<Area, string> = {
  main_gate: '정문',
  back_gate: '후문',
  station: '광운대역',
  uicheon: '우이천변',
};

export const venueName: Record<Venue, string> = {
  donghae: '동해문화예술관',
  icerink: '아이스링크',
};

export const localInput = (date: Date | null) =>
  date && !Number.isNaN(date.getTime())
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    : '';

// 샘플 공연의 날짜만 오늘·내일로 다시 맞추고, 시각은 원본 그대로 둔다.
export function recalcToTodayTomorrow(events: EventDoc[], now = new Date()): EventDoc[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const targets = [today, tomorrow];
  const days = [...new Set(events.map((event) => event.startsAt.slice(0, 10)))].sort();
  return events.map((event) => {
    const original = new Date(event.startsAt);
    const target = new Date(
      targets[Math.min(days.indexOf(event.startsAt.slice(0, 10)), targets.length - 1)],
    );
    target.setHours(original.getHours(), original.getMinutes(), original.getSeconds(), 0);
    return { ...event, id: `demo-${event.id}`, startsAt: target.toISOString() };
  });
}

export function FormPage({
  title,
  onSubmit,
  children,
  current = 2,
  total = 2,
  stepLabel = '내용 확인',
}: {
  title: string;
  onSubmit(e: FormEvent<HTMLFormElement>): void;
  children: ReactNode;
  current?: number;
  total?: number;
  stepLabel?: string;
}) {
  return (
    <section className="screen">
      <AppBar />
      <Stepper current={current} total={total} label={stepLabel} />
      <div className="screen__content">
        <h1 className="screen__title">{title}</h1>
        <p className="screen__description">틀린 곳은 눌러서 고쳐 주세요</p>
        <form className="form" onSubmit={onSubmit}>
          {children}
          <Button size="l" full>
            이 내용으로 인증하기
          </Button>
        </form>
      </div>
    </section>
  );
}
