import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { PSM } from 'tesseract.js';
import { useSession } from '../app/Session';
import { VENUE_POINTS } from '../data/places';
import type { Venue } from '../data/types';
import { formatEventDateTime } from '../lib/format';
import { distanceMeters } from '../lib/geo';
import { LIVE_SCAN_ENABLED } from '../lib/flags';
import { startRinkReceiptLiveScan, startTicketLiveScan } from '../lib/ocr/live';
import { geminiReceipt, geminiTicket } from '../lib/ocr/gemini';
import { parseRinkReceipt, parseTicket, titleSimilarity } from '../lib/ocr/parse';
import { preprocessImage } from '../lib/ocr/preprocess';
import {
  validateRinkResult,
  validateTicketResult,
  validateTicketWithoutEvent,
} from '../lib/ocr/validation';
import { recognizeImageMulti } from '../lib/ocr/worker';
import { AppBar } from '../ui/AppBar';
import { authErrorMessage } from '../ui/AuthErrorBanner';
import { Button } from '../ui/Button';
import { CameraIcon, CheckIcon, NavigationIcon } from '../ui/icons';
import { Stepper } from '../ui/Stepper';
import { localInput, venueName } from './shared';

type LiveValues = {
  title?: string;
  dateTime?: Date | null;
  partySize?: number;
  amount?: number;
  bookingNo?: string;
  dateDefaulted?: boolean;
};

function formatLivePreview(venue: Venue, fields: LiveValues) {
  const parts: string[] = [];
  if (venue === 'donghae' && fields.title) parts.push(fields.title);
  if (venue === 'icerink' && fields.partySize) parts.push(`${fields.partySize}명`);
  if (venue === 'icerink' && fields.amount !== undefined)
    parts.push(`${fields.amount.toLocaleString('ko-KR')}원`);
  if (fields.dateTime) {
    const date = fields.dateTime;
    const day = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    parts.push(
      venue === 'donghae'
        ? `${date.getMonth() + 1}/${date.getDate()}(${day}) ${time}`
        : `${date.getMonth() + 1}/${date.getDate()}`,
    );
  }
  if (venue === 'donghae' && fields.partySize) parts.push(`${fields.partySize}명`);
  return parts.join(' · ');
}

export default function Visitor() {
  const { venue } = useParams();
  const session = useSession();
  const navigate = useNavigate();
  const value = venue as Venue;
  const total = value === 'donghae' ? 4 : 2;
  const video = useRef<HTMLVideoElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const album = useRef<HTMLInputElement>(null);
  const stopScan = useRef<() => void>(() => {});
  const [step, setStep] = useState(1);
  const [eventId, setEventId] = useState('');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState('');
  const [recognized, setRecognized] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [partial, setPartial] = useState(false);
  const [liveValues, setLiveValues] = useState<LiveValues>({});
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [partySize, setPartySize] = useState('1');
  const [amount, setAmount] = useState('');
  const [dateDefaulted, setDateDefaulted] = useState(false);
  const [engine, setEngine] = useState<'gemini' | 'tesseract' | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const afterTomorrow = new Date(today);
  afterTomorrow.setDate(afterTomorrow.getDate() + 2);
  const performances = session.events.filter((event) => {
    const starts = new Date(event.startsAt);
    return starts >= today && starts < afterTomorrow;
  });
  const selectedEvent = session.events.find((event) => event.id === eventId);
  const now = new Date();
  const horizon = new Date(now.getTime() + 31 * 86_400_000);
  const upcomingEvents = [...session.events]
    .filter((event) => {
      const starts = new Date(event.startsAt);
      return starts > now && starts <= horizon;
    })
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const upcomingGroups = Array.from(
    upcomingEvents
      .reduce((map, event) => {
        const key = event.kopisId || event.title;
        const group = map.get(key) || {
          key,
          title: event.title,
          poster: event.poster,
          hall: event.hall,
          dates: [] as Date[],
        };
        group.dates.push(new Date(event.startsAt));
        map.set(key, group);
        return map;
      }, new Map<string, { key: string; title: string; poster?: string; hall?: string; dates: Date[] }>())
      .values(),
  ).slice(0, 5);
  const meters = session.location
    ? Math.round(distanceMeters(session.location, VENUE_POINTS.donghae))
    : null;

  const captureStep = value === 'donghae' ? 3 : 1;
  const hasLiveValue = Boolean(
    liveValues.title ||
    liveValues.dateTime ||
    liveValues.partySize ||
    liveValues.amount !== undefined ||
    liveValues.bookingNo,
  );

  function applyParsed(parsed: LiveValues, text: string) {
    setLiveValues((current) => ({ ...current, ...parsed }));
    if (parsed.title) setTitle(parsed.title);
    if (parsed.dateTime) setDateTime(localInput(parsed.dateTime));
    if (parsed.partySize) setPartySize(String(parsed.partySize));
    if (parsed.amount !== undefined) setAmount(String(parsed.amount));
    if (parsed.dateDefaulted !== undefined) setDateDefaulted(parsed.dateDefaulted);
    setRecognized(
      Boolean(
        parsed.title ||
        parsed.dateTime ||
        parsed.partySize ||
        parsed.amount !== undefined ||
        parsed.bookingNo,
      ),
    );
  }

  function finishLiveScan(isPartial = false) {
    stopScan.current();
    setPartial(isPartial);
    setConfirmed(true);
    setMessage('인식 완료');
    window.setTimeout(() => setStep(total), 350);
  }

  useEffect(() => {
    if (!LIVE_SCAN_ENABLED || step !== captureStep || fallback || !video.current) return;
    let active = true;
    setConfirmed(false);
    setPartial(false);
    setMessage('카메라를 준비하고 있어요');
    const callbacks = {
      onFrame(parsed: LiveValues, text: string) {
        if (!active) return;
        applyParsed(parsed, text);
        setMessage('글자를 인식하고 있어요');
      },
      onResult(parsed: LiveValues, text: string, isPartial?: boolean) {
        if (!active) return;
        applyParsed(parsed, text);
        finishLiveScan(Boolean(isPartial));
      },
      onTimeout() {
        if (!active) return;
        setFallback(true);
        setMessage('라이브 인식 시간이 지나 사진 인증으로 전환했어요');
      },
    };
    const scan =
      value === 'donghae'
        ? startTicketLiveScan(video.current, callbacks)
        : startRinkReceiptLiveScan(video.current, callbacks);
    scan
      .then((stop) => {
        if (active) stopScan.current = stop;
        else stop();
      })
      .catch(() => {
        if (!active) return;
        setFallback(true);
        setMessage('카메라를 사용할 수 없어 사진 인증으로 전환했어요');
      });
    return () => {
      active = false;
      stopScan.current();
    };
  }, [step, captureStep, fallback, value, total]);

  if (!venueName[value]) return <Navigate to="/verify" replace />;

  function requestLocation() {
    setMessage('위치를 확인하고 있어요');
    if (!navigator.geolocation) {
      setMessage('위치를 확인할 수 없어요. 위치 기능을 지원하는 브라우저에서 다시 시도해 주세요');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        session.setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setMessage('');
      },
      () =>
        setMessage(
          '위치 권한이 꺼져 있어요. 브라우저 설정에서 위치를 허용한 뒤 다시 시도해 주세요',
        ),
      { timeout: 10_000 },
    );
  }

  async function read(file?: File) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setProgress(0.01);
    setMessage('사진을 읽고 있어요');
    setFallbackNotice(false);
    try {
      try {
        if (value === 'donghae') {
          const parsed = await geminiTicket(file);
          setTitle(parsed.title);
          setDateTime(parsed.dateTime);
          setPartySize(String(parsed.partySize || 1));
          setRecognized(Boolean(parsed.title || parsed.dateTime || parsed.bookingNo));
        } else {
          const parsed = await geminiReceipt(file);
          setDateTime(parsed.dateTime);
          setPartySize(String(parsed.partySize || 1));
          setAmount(parsed.amount === null ? '' : String(parsed.amount));
          setDateDefaulted(false);
          setRecognized(Boolean(parsed.dateTime || parsed.partySize || parsed.amount !== null));
        }
        setEngine('gemini');
        setProgress(1);
        setMessage('인식한 내용을 확인해 주세요');
        setStep(total);
        return;
      } catch {
        setFallbackNotice(true);
        setEngine('tesseract');
      }
      const image = await preprocessImage(file, { crop: 'bright' });
      const psms =
        value === 'icerink'
          ? [PSM.SINGLE_COLUMN, PSM.SINGLE_BLOCK]
          : [PSM.SINGLE_BLOCK, PSM.SPARSE_TEXT];
      const { text } = await recognizeImageMulti(image, psms, setProgress);
      setEngine('tesseract');
      setRecognized(Boolean(text.trim()));
      if (value === 'donghae') {
        const parsed = parseTicket(text);
        setTitle(parsed.title);
        setDateTime(localInput(parsed.dateTime));
        setPartySize(String(parsed.partySize || 1));
      } else {
        const parsed = parseRinkReceipt(text);
        setDateTime(localInput(parsed.dateTime));
        setPartySize(String(parsed.partySize || 1));
        setAmount(String(parsed.amount || ''));
        setDateDefaulted(parsed.dateDefaulted);
      }
      setMessage(text.trim() ? '인식한 내용을 확인해 주세요' : '글자를 찾지 못했어요');
      setStep(total);
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'ocr-download-failed')
        setMessage('인식 엔진을 내려받지 못했어요. 인터넷 연결 후 다시 시도해 주세요');
      else if (code === 'image-decode-failed')
        setMessage('이 사진 형식은 읽을 수 없어요. 카메라로 다시 찍어 주세요');
      else setMessage('글자를 찾지 못했어요');
      if (value === 'icerink') setStep(total);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const date = dateTime ? new Date(dateTime) : null;
    const now = new Date();
    let error = '';
    if (value === 'donghae') {
      error = selectedEvent
        ? validateTicketResult(title, date, new Date(selectedEvent.startsAt), now)
        : validateTicketWithoutEvent(title, date, now);
      if (selectedEvent && !error && titleSimilarity(title, selectedEvent.title) < 0.45) {
        error = '공연명이 선택한 공연과 일치하지 않아요';
      }
    } else {
      error = validateRinkResult(Number(partySize), date, now);
    }
    if (error && !session.presentation) {
      setMessage(`${error} 다시 확인해 주세요`);
      return;
    }
    await session.data!.users.update(session.auth!.uid, {
      visitor: {
        venue: value,
        eventId: selectedEvent?.id,
        partySize: Number(partySize) || undefined,
        verifiedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 86_400_000).toISOString(),
      },
    });
    await session.refreshUser();
    session.setDestination(value);
    navigate('/');
  }

  const stepLabel =
    value === 'donghae'
      ? ['공연 선택', '위치 확인', '티켓 촬영', '내용 확인'][step - 1]
      : ['촬영', '내용 확인'][step - 1];
  const captureTitle = LIVE_SCAN_ENABLED
    ? value === 'donghae'
      ? '티켓을 비춰 주세요'
      : '영수증을 비춰 주세요'
    : value === 'donghae'
      ? '티켓을 찍어 주세요'
      : '영수증을 찍어 주세요';

  return (
    <section className="screen verify-flow">
      <AppBar />
      <Stepper current={step} total={total} label={stepLabel} />
      {value === 'donghae' && step === 1 && (
        <div className="screen__content flow-step">
          <h1 className="screen__title">어떤 공연을 보시나요?</h1>
          {performances.length ? (
            <div className="radio-list">
              {performances.map((event) => (
                <label key={event.id}>
                  <input
                    type="radio"
                    name="event"
                    value={event.id}
                    checked={eventId === event.id}
                    onChange={() => setEventId(event.id)}
                  />
                  {event.poster ? (
                    <div className="radio-list__row">
                      <img
                        className="radio-list__poster"
                        src={event.poster}
                        alt={event.title}
                        loading="lazy"
                      />
                      <span>
                        <strong>{event.title}</strong>
                        <small>
                          {formatEventDateTime(new Date(event.startsAt))}
                          {event.hall ? ` · ${event.hall}` : ''}
                        </small>
                      </span>
                    </div>
                  ) : (
                    <span>
                      <strong>{event.title}</strong>
                      <small>
                        {formatEventDateTime(new Date(event.startsAt))}
                        {event.hall ? ` · ${event.hall}` : ''}
                      </small>
                    </span>
                  )}
                </label>
              ))}
            </div>
          ) : (
            <div className="status-box">
              <span>
                <strong>아직 등록된 공연이 없어요</strong>
                <small>티켓만으로 인증할 수 있어요</small>
              </span>
            </div>
          )}
          {!performances.length && upcomingGroups.length > 0 && (
            <div className="upcoming-events">
              <p className="upcoming-events__label">다가오는 공연</p>
              <div className="upcoming-events__list">
                {upcomingGroups.map((group) => {
                  const parts = group.dates.map((date) => formatEventDateTime(date));
                  const dateLabels = parts.map((part) => part.slice(0, part.lastIndexOf(' ')));
                  const time = parts[0].slice(parts[0].lastIndexOf(' ') + 1);
                  const line = `${group.title} · ${dateLabels.join('·')} ${time}${group.hall ? ` · ${group.hall}` : ''}`;
                  return (
                    <div className="radio-list__row" key={group.key}>
                      {group.poster && (
                        <img
                          className="radio-list__poster"
                          src={group.poster}
                          alt={group.title}
                          loading="lazy"
                        />
                      )}
                      <span>{line}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <Button
            size="l"
            full
            disabled={performances.length > 0 && !eventId}
            onClick={() => setStep(2)}
          >
            다음으로 가기
          </Button>
        </div>
      )}
      {value === 'donghae' && step === 2 && (
        <div className="screen__content flow-step">
          <h1 className="screen__title">공연장 근처에 계신지 확인할게요</h1>
          <p className="screen__description">동해문화예술관 반경 500m 안에서만 인증할 수 있어요</p>
          {meters === null ? (
            <div className="location-placeholder">
              <NavigationIcon />
              <span>위치를 확인해 주세요</span>
            </div>
          ) : (
            <div
              className={`location-result ${meters <= 500 ? 'location-result--success' : 'location-result--danger'}`}
            >
              <strong className="num">{meters}m</strong>
              <span>
                공연장까지 ·{' '}
                {meters <= 500 ? '반경 500m 안이에요' : `${meters - 500}m 더 가까이 와 주세요`}
              </span>
            </div>
          )}
          <p role="status">{message}</p>
          {meters !== null && meters <= 500 ? (
            <Button size="l" full onClick={() => setStep(3)}>
              티켓 찍으러 가기
            </Button>
          ) : (
            <Button size="l" full onClick={requestLocation}>
              {meters === null ? '위치 확인하기' : '다시 확인하기'}
            </Button>
          )}
          {session.presentation && (
            <button className="text-action text-action--warning" onClick={() => setStep(3)}>
              발표 모드: 위치 확인 건너뛰기
            </button>
          )}
        </div>
      )}
      {step === captureStep && (
        <div className="screen__content capture-step">
          <h1 className="screen__title">{captureTitle}</h1>
          {LIVE_SCAN_ENABLED && !fallback ? (
            <>
              <div className="camera-box">
                <video ref={video} playsInline muted autoPlay />
                <div className="scan-frame">
                  <span className="scan-frame__corner scan-frame__corner--tl" />
                  <span className="scan-frame__corner scan-frame__corner--tr" />
                  <span className="scan-frame__corner scan-frame__corner--bl" />
                  <span className="scan-frame__corner scan-frame__corner--br" />
                </div>
              </div>
              <div className={`scan-status${confirmed ? ' scan-status--done' : ''}`} role="status">
                {confirmed ? (
                  <p className="scan-status__done">
                    <CheckIcon size={16} />
                    인식 완료
                  </p>
                ) : (
                  <>
                    <div className="live-status">
                      <span>인식 중</span>
                      <i />
                      <i />
                      <i />
                    </div>
                    <p className="live-preview">
                      {formatLivePreview(value, liveValues) ||
                        (value === 'donghae'
                          ? '공연명과 날짜가 보이게 비춰 주세요'
                          : '인원과 금액이 보이게 비춰 주세요')}
                    </p>
                  </>
                )}
              </div>
              <Button
                variant="secondary"
                size="l"
                full
                disabled={!hasLiveValue}
                onClick={() => finishLiveScan(true)}
              >
                지금까지 읽은 내용으로 계속
              </Button>
              <button
                className="text-action"
                onClick={() => {
                  stopScan.current();
                  setFallback(true);
                  setMessage('사진을 촬영하거나 앨범에서 골라 주세요');
                }}
              >
                사진으로 대신 인증하기
              </button>
            </>
          ) : (
            <>
              <p className="screen__description">
                {value === 'donghae'
                  ? '공연명과 날짜가 보이게 찍어 주세요'
                  : '인원과 금액이 보이게 찍어 주세요'}
              </p>
              {preview && (
                <img className="capture-preview" src={preview} alt="찍은 티켓 또는 영수증" />
              )}
              {progress > 0 && progress < 1 && (
                <div className="ocr-progress" role="status">
                  <progress value={progress} max="1" />
                  <span className="num">{Math.round(progress * 100)}% · 글자 읽는 중</span>
                </div>
              )}
              <Button variant="secondary" size="l" full onClick={() => camera.current?.click()}>
                <CameraIcon />
                {preview ? '다시 찍기' : '티켓·영수증 촬영하기'}
              </Button>
              <button className="text-action" onClick={() => album.current?.click()}>
                앨범에서 고르기
              </button>
            </>
          )}
          <input
            ref={camera}
            className="file-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => read(event.target.files?.[0])}
          />
          <input
            ref={album}
            className="file-input"
            type="file"
            accept="image/*"
            onChange={(event) => read(event.target.files?.[0])}
          />
          {(session.presentation || value === 'icerink') && (
            <button
              className="text-action"
              onClick={() => {
                stopScan.current();
                setPartial(false);
                setStep(total);
              }}
            >
              직접 입력하기
            </button>
          )}
          <p role="status">{message}</p>
        </div>
      )}
      {step === total && (
        <div className="screen__content">
          <h1 className="screen__title">읽은 내용을 확인해 주세요</h1>
          <p className="screen__description">틀린 곳은 눌러서 고쳐 주세요</p>
          {partial && (
            <div className="status-box">일부만 읽었어요. 나머지는 직접 입력해 주세요</div>
          )}
          {preview && (
            <div className="result-photo">
              <img src={preview} alt="찍은 티켓 또는 영수증" />
              <span>찍은 사진</span>
              <button onClick={() => setStep(captureStep)}>다시 찍기</button>
            </div>
          )}
          <form className="form" onSubmit={submit}>
            {value === 'donghae' && (
              <label>
                <span>공연명 {recognized && <small className="auto-tag">인식됨</small>}</span>
                <input
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setRecognized(false);
                  }}
                  required
                />
              </label>
            )}
            <label>
              <span>이용 일시 {recognized && <small className="auto-tag">인식됨</small>}</span>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(event) => {
                  setDateTime(event.target.value);
                  setRecognized(false);
                }}
                required
              />
              {value === 'icerink' && dateDefaulted && (
                <small>날짜가 없어 오늘 기준으로 채웠어요</small>
              )}
            </label>
            <label>
              인원
              <input
                type="number"
                min="1"
                max="20"
                value={partySize}
                onChange={(event) => setPartySize(event.target.value)}
                required
              />
            </label>
            <label>
              금액
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            <p role="status">{session.authError ? authErrorMessage(session.authError) : message}</p>
            <Button size="l" full disabled={!!session.authError}>
              이 내용으로 인증하기
            </Button>
          </form>
        </div>
      )}
    </section>
  );
}
