import { useState } from 'react';
import { useSession } from '../app/Session';
import type { EventDoc } from '../data/types';
import { makeDemoQr, renderQr } from '../lib/qr';
import { recalcToTodayTomorrow } from './shared';
import demoEvents from '../../seed/events.sample.json';

export default function Dev() {
  const s = useSession(),
    [qr, setQr] = useState(''),
    [message, setMessage] = useState('');
  async function create() {
    setQr(await renderQr(await makeDemoQr('2026123456', '홍길동', '공과대학')));
  }
  async function seed() {
    try {
      await s.data!.seed();
      setMessage(`${s.data!.mode === 'local' ? '로컬 저장소' : 'Firestore'}에 시드를 넣었어요.`);
    } catch (error) {
      setMessage(
        `시드를 넣지 못했어요. Firebase에서는 admins/${s.auth?.uid} 문서와 규칙을 확인해 주세요. (${String(error)})`,
      );
    }
  }
  async function addDemoEvents() {
    try {
      await s.data!.events.addEvents(recalcToTodayTomorrow(demoEvents as EventDoc[]));
      setMessage('데모 공연을 오늘·내일 날짜로 추가했어요.');
    } catch (error) {
      setMessage(
        `데모 공연을 추가하지 못했어요. Firebase에서는 admins/${s.auth?.uid} 문서와 규칙을 확인해 주세요. (${String(error)})`,
      );
    }
  }
  return (
    <section className="developer">
      <h1>개발자 메뉴</h1>
      <p>현재 데이터 모드: {s.data?.mode || '확인 중'}</p>
      {s.authError && <p>인증 오류 코드: {s.authError}</p>}
      <label>
        <input
          type="checkbox"
          checked={s.presentation}
          onChange={(e) => s.setPresentation(e.target.checked)}
        />{' '}
        발표 모드
      </label>
      <button onClick={create}>샘플 QR 생성</button>
      {qr && <img src={qr} alt="샘플 학생 QR" />}
      <button onClick={seed}>시드 투입</button>
      <button onClick={addDemoEvents}>데모 공연 추가(오늘·내일)</button>
      <p className="screen__description">실제 일정은 KOPIS에서 받아요. 발표용으로만 쓰세요.</p>
      <p role="status">{message}</p>
    </section>
  );
}
