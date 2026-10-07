import jsQR from 'jsqr';
import QRCode from 'qrcode';
const SECRET = 'wolgye1-demo-secret'; // 데모 전용 비밀키입니다. 실서비스에 사용하지 않습니다.
const hex = (b: ArrayBuffer) =>
  Array.from(new Uint8Array(b))
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
async function signature(body: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))).slice(0, 8);
}
export async function makeDemoQr(
  studentNo: string,
  name: string,
  college: string,
  issued = new Date(),
) {
  const body = `KW1|${studentNo}|${name}|${college}|${issued.toISOString()}`;
  return `${body}|${await signature(body)}`;
}
export async function parseDemoQr(value: string) {
  const p = value.split('|');
  if (p.length !== 6 || p[0] !== 'KW1')
    throw new Error('지원하지 않는 QR이에요. 개발자 메뉴의 샘플 QR을 사용해 주세요.');
  const body = p.slice(0, 5).join('|');
  if ((await signature(body)) !== p[5])
    throw new Error('QR 서명이 올바르지 않아요. 새 QR을 만들어 주세요.'); // INTEGRATION: KLAS QR 실규격과 서버측 자격 검증으로 교체합니다.
  return { studentNo: p[1], name: p[2], college: p[3], issuedAt: p[4] };
}
export async function decodeQrImage(file: Blob) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d')!;
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(image.data, canvas.width, canvas.height)?.data;
}
export const renderQr = (value: string) => QRCode.toDataURL(value, { width: 280, margin: 1 });
export async function scanFrame(video: HTMLVideoElement) {
  const c = document.createElement('canvas');
  c.width = video.videoWidth;
  c.height = video.videoHeight;
  const x = c.getContext('2d')!;
  x.drawImage(video, 0, 0);
  if ('BarcodeDetector' in globalThis) {
    const Detector = (
      globalThis as unknown as {
        BarcodeDetector: new (o: { formats: string[] }) => {
          detect: (v: CanvasImageSource) => Promise<{ rawValue: string }[]>;
        };
      }
    ).BarcodeDetector;
    return (await new Detector({ formats: ['qr_code'] }).detect(c))[0]?.rawValue;
  }
  const data = x.getImageData(0, 0, c.width, c.height);
  return jsQR(data.data, c.width, c.height)?.data;
}
export async function openCamera(video: HTMLVideoElement) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' },
  });
  video.srcObject = stream;
  await video.play();
  return () => stream.getTracks().forEach((t) => t.stop());
}
