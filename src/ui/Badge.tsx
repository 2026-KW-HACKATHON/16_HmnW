import type { Audience } from '../data/types';
import { SchoolIcon, TicketIcon, UsersIcon } from './icons';
export function Badge({ audience }: { audience: Audience['type'] }) {
  const map = {
    all: ['누구나', UsersIcon],
    student: ['학생', SchoolIcon],
    visitor: ['방문객', TicketIcon],
  } as const;
  const [label, Glyph] = map[audience];
  return (
    <span className={`badge badge--${audience}`}>
      <Glyph size={14} />
      {label}
    </span>
  );
}
