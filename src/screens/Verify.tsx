import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { warmupOcr } from '../lib/ocr/worker';
import { AppBar } from '../ui/AppBar';
import { ChevronRightIcon, QrIcon, SchoolIcon, TicketIcon } from '../ui/icons';
import { venueName } from './shared';

export default function Verify() {
  useEffect(() => {
    const hasIdle = typeof window.requestIdleCallback === 'function';
    const idle = hasIdle
      ? window.requestIdleCallback(warmupOcr)
      : window.setTimeout(warmupOcr, 1500);
    return () => {
      if (hasIdle) window.cancelIdleCallback(idle as number);
      else window.clearTimeout(idle as number);
    };
  }, []);
  return (
    <section className="screen verify">
      <AppBar root title="인증" />
      <div className="screen__content">
        <h1 className="screen__title">자격 인증</h1>
        <p className="screen__description">한 번 인증하면 조건에 맞는 혜택이 열려요</p>
        <section className="verify__section">
          <h2>광운대 학생</h2>
          <Link className="selection-row" to="/verify/student/card">
            <SchoolIcon />
            <span>
              <strong>학생증으로 인증하기</strong>
              <small>학번과 단과대를 읽어요</small>
            </span>
            <ChevronRightIcon />
          </Link>
          <Link className="selection-row" to="/verify/student/qr">
            <QrIcon />
            <span>
              <strong>KLAS QR로 인증하기</strong>
              <small>카메라로 QR을 스캔해요</small>
            </span>
            <ChevronRightIcon />
          </Link>
        </section>
        <section className="verify__section">
          <h2>방문객</h2>
          <p>두 시설은 같은 주소(광운로 21)에 나란히 있어요</p>
          {Object.entries(venueName).map(([value, label]) => (
            <Link className="selection-row" to={`/verify/visitor/${value}`} key={value}>
              <TicketIcon />
              <span>
                <strong>{label}</strong>
                <small>
                  {value === 'donghae'
                    ? '공연 티켓으로 인증해요'
                    : '현장 티켓이나 영수증으로 인증해요'}
                </small>
              </span>
              <ChevronRightIcon />
            </Link>
          ))}
        </section>
      </div>
    </section>
  );
}
