import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../app/Session';
import { sha256Hex } from '../lib/hash';
import { LIVE_SCAN_ENABLED } from '../lib/flags';
import { startStudentLiveScan } from '../lib/ocr/live';
import { geminiStudentCard } from '../lib/ocr/gemini';
import { preprocessImage } from '../lib/ocr/preprocess';
import { assessStudentCard, COLLEGES, parseStudentCard, redactSensitive } from '../lib/ocr/student';
import { PSM } from 'tesseract.js';
import { recognizeImageMulti } from '../lib/ocr/worker';
import { AppBar } from '../ui/AppBar';
import { authErrorMessage } from '../ui/AuthErrorBanner';
import { Button } from '../ui/Button';
import { ClubPicker } from '../ui/ClubPicker';
import { CameraIcon, CheckIcon } from '../ui/icons';
import { Stepper } from '../ui/Stepper';

export default function StudentCard() {
  const session = useSession();
  const navigate = useNavigate();
  const video = useRef<HTMLVideoElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const album = useRef<HTMLInputElement>(null);
  const stopScan = useRef<() => void>(() => {});
  const [step, setStep] = useState<1 | 2>(1);
  const [fallback, setFallback] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(LIVE_SCAN_ENABLED ? '카메라를 준비하고 있어요' : '');
  const [preview, setPreview] = useState('');
  const [rawText, setRawText] = useState('');
  const [engine, setEngine] = useState<'gemini' | 'tesseract' | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState(false);
  const [studentNo, setStudentNo] = useState('');
  const [name, setName] = useState('');
  const [college, setCollege] = useState<(typeof COLLEGES)[number]>('전자정보공과대학');
  const [clubs, setClubs] = useState<string[]>([]);
  const assessment = assessStudentCard({ studentNo, name, college }, rawText);

  const applyResult = (parsed: ReturnType<typeof parseStudentCard>, text: string) => {
    setStudentNo(parsed.studentNo);
    setName(parsed.name);
    if (parsed.college) setCollege(parsed.college as (typeof COLLEGES)[number]);
    setRawText(text);
  };

  useEffect(() => {
    if (!LIVE_SCAN_ENABLED || step !== 1 || fallback || !video.current) return;
    let active = true;
    setConfirmed(false);
    startStudentLiveScan(video.current, {
      onFrame(parsed, text) {
        if (!active) return;
        applyResult(parsed, text);
      },
      onResult(parsed, text) {
        if (!active) return;
        applyResult(parsed, text);
        setConfirmed(true);
        setMessage('학생증을 인식했어요');
        window.setTimeout(() => setStep(2), 350);
      },
      onTimeout() {
        if (active) setMessage('60초 동안 확인하지 못했어요. 사진으로 다시 시도해 주세요');
      },
    })
      .then((stop) => (stopScan.current = stop))
      .catch(() => {
        if (active) {
          setFallback(true);
          setMessage('카메라를 계속 켤 수 없어 사진 촬영으로 전환했어요');
        }
      });
    return () => {
      active = false;
      stopScan.current();
    };
  }, [step, fallback]);

  async function read(file?: File) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setProgress(0.01);
    setMessage('사진을 읽고 있어요');
    setFallbackNotice(false);
    try {
      try {
        const parsed = await geminiStudentCard(file);
        const summary = JSON.stringify(
          { ...parsed, school: parsed.isKwangwoon ? '광운대학교' : '' },
          null,
          2,
        );
        applyResult(parsed, summary);
        setEngine('gemini');
        setProgress(1);
        setMessage('인식한 내용을 확인해 주세요');
        setStep(2);
        return;
      } catch {
        setFallbackNotice(true);
      }
      const image = await preprocessImage(file, { crop: 'bright' });
      const { text } = await recognizeImageMulti(
        image,
        [PSM.SPARSE_TEXT, PSM.SINGLE_BLOCK],
        setProgress,
      );
      applyResult(parseStudentCard(text), redactSensitive(text));
      setEngine('tesseract');
      setMessage('인식한 내용을 확인해 주세요');
      setStep(2);
    } catch (error) {
      setMessage(
        (error as { code?: string }).code === 'image-decode-failed'
          ? '이 사진 형식은 읽을 수 없어요. 카메라로 다시 찍어 주세요'
          : '사진을 읽지 못했어요. 다시 찍어 주세요',
      );
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{10}$/.test(studentNo)) return setMessage('학번은 숫자 10자리로 입력해 주세요');
    try {
      await session.data!.students.claim(await sha256Hex(studentNo), session.auth!.uid);
      const form = new FormData(event.currentTarget);
      await session.data!.users.update(session.auth!.uid, {
        student: {
          method: 'card',
          studentNoMasked: `${studentNo.slice(0, 4)}******`,
          college: String(form.get('college')),
          clubs,
          verifiedAt: new Date().toISOString(),
          expiresAt: '2026-12-31T23:59:59+09:00',
        },
      });
      await session.refreshUser();
      navigate('/');
    } catch (error) {
      setMessage(
        (error as { code?: string }).code === 'already-claimed'
          ? '이미 다른 기기에서 인증된 학번이에요. 본인이라면 더보기 → 문의하기로 알려 주세요'
          : String(error),
      );
    }
  }

  const manual = () => {
    stopScan.current();
    setRawText('');
    setStep(2);
  };
  return (
    <section className="screen verify-flow">
      <AppBar />
      <Stepper
        current={step}
        total={2}
        label={step === 1 ? (LIVE_SCAN_ENABLED ? '스캔' : '촬영') : '내용 확인'}
      />
      {step === 1 ? (
        <div className="screen__content capture-step">
          <h1 className="screen__title">
            {LIVE_SCAN_ENABLED ? '학생증을 스캔해 주세요' : '학생증을 찍어 주세요'}
          </h1>
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
              <p>학생증을 프레임에 맞추고 천천히 움직여 주세요</p>
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
                      {studentNo
                        ? `학번 ${studentNo.slice(0, 4)}······${college ? ` · ${college}` : ''}`
                        : '학번과 이름이 보이게 비춰 주세요'}
                    </p>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="screen__description">
                학생증을 <strong>세로로</strong> 놓고, 학번과 이름이 잘 보이게 찍어 주세요
              </p>
              {preview && <img className="capture-preview" src={preview} alt="찍은 학생증" />}
              {progress > 0 && progress < 1 && (
                <div className="ocr-progress" role="status">
                  <progress value={progress} max="1" />
                  <span>{Math.round(progress * 100)}% · 글자 읽는 중</span>
                </div>
              )}
              <div className="student-card-hint">
                <div className="student-card-hint__card">
                  <span />
                  <span />
                  <span />
                </div>
                <p className="student-card-hint__caption">세로로 찍으면 더 잘 읽혀요</p>
              </div>
              <Button variant="secondary" size="l" full onClick={() => camera.current?.click()}>
                <CameraIcon />
                {preview ? '다시 찍기' : '학생증 촬영하기'}
              </Button>
              {session.presentation && (
                <button className="text-action" onClick={() => album.current?.click()}>
                  앨범에서 고르기
                </button>
              )}
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
          {LIVE_SCAN_ENABLED && !fallback && (
            <button
              className="text-action"
              onClick={() => {
                stopScan.current();
                setFallback(true);
              }}
            >
              사진으로 대신 인증하기
            </button>
          )}
          {session.presentation && (
            <button className="text-action" onClick={manual}>
              직접 입력하기
            </button>
          )}
          <p role="status">{message}</p>
        </div>
      ) : (
        <div className="screen__content">
          <h1 className="screen__title">읽은 내용을 확인해 주세요</h1>
          {assessment.confidence === 'low' && (
            <div className="status-box status-box--danger">
              학생증이 선명하게 인식되지 않았어요. 다시 스캔해 주세요
            </div>
          )}
          <form className="form" onSubmit={submit}>
            <label>
              <span>학번 {engine && <small className="auto-tag">인식됨</small>}</span>
              <input
                value={studentNo}
                onChange={(e) => setStudentNo(e.target.value)}
                readOnly={!session.presentation}
                inputMode="numeric"
                required
              />
            </label>
            <label>
              <span>이름 {engine && <small className="auto-tag">인식됨</small>}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                readOnly={!session.presentation}
                required
              />
            </label>
            <label>
              <span>단과대 {engine && <small className="auto-tag">인식됨</small>}</span>
              <select
                name="college"
                value={college}
                onChange={(e) => setCollege(e.target.value as (typeof COLLEGES)[number])}
              >
                {COLLEGES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>동아리</legend>
              <ClubPicker value={clubs} onChange={setClubs} />
              <small>동아리는 본인이 선택해요 · 동아리 제휴 혜택에 쓰여요</small>
            </fieldset>
            <p role="status">{session.authError ? authErrorMessage(session.authError) : message}</p>
            <Button
              size="l"
              full
              disabled={
                !!session.authError || (!session.presentation && assessment.confidence === 'low')
              }
            >
              이 내용으로 인증하기
            </Button>
          </form>
        </div>
      )}
    </section>
  );
}
