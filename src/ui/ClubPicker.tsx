import { useState } from 'react';
import { CLUB_GROUPS } from '../data/clubs';
import { Chip } from './Chip';

export function ClubPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const toggle = (club: string) =>
    onChange(value.includes(club) ? value.filter((x) => x !== club) : [...value, club]);
  const groups = CLUB_GROUPS.map(({ group, clubs }) => ({
    group,
    clubs: needle ? clubs.filter((club) => club.toLowerCase().includes(needle)) : clubs,
  })).filter((item) => item.clubs.length);
  return (
    <div className="club-picker">
      {value.length > 0 && (
        <div className="club-picker__selected" aria-label="선택한 동아리">
          {value.map((club) => (
            <Chip key={club} pressed onClick={() => toggle(club)} aria-label={`${club} 선택 해제`}>
              {club}
            </Chip>
          ))}
        </div>
      )}
      <input
        className="club-picker__search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="동아리 이름 검색"
        aria-label="동아리 검색"
      />
      {groups.map(({ group, clubs }) => {
        const picked = clubs.filter((club) => value.includes(club)).length;
        return (
          <details key={group} className="club-picker__group" open={needle ? true : undefined}>
            <summary>
              {group}
              <small>
                {picked ? `${picked}개 선택 · ` : ''}
                {clubs.length}개
              </small>
            </summary>
            <div className="club-picker__chips">
              {clubs.map((club) => (
                <Chip key={club} pressed={value.includes(club)} onClick={() => toggle(club)}>
                  {club}
                </Chip>
              ))}
            </div>
          </details>
        );
      })}
      {!groups.length && <p className="club-picker__empty">검색 결과가 없어요</p>}
    </div>
  );
}
