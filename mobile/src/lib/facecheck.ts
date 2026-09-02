// 프로필 사진 자동 검수 (웹) — MediaPipe Face Detector로 얼굴 수·크기·정면 여부·선명도를 판정한다.
// 모델은 브라우저에서 지연 로드된다. 로드 실패 시 'unavailable'을 돌려 주고, 호출 측은 서버 검수 대기(pending)로 처리한다.

import { Platform } from 'react-native';

export interface FaceCheck {
  ok: boolean;
  status: 'auto_ok' | 'rejected' | 'unavailable';
  reason?: string;                 // 사용자에게 보여 줄 반려 사유
  metrics?: {
    faces: number; faceWidthRatio: number; frontal: number; earSymmetry: number; sharpness: number; imageW: number; imageH: number;
  };
}

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

// 판정 기준 — 한 곳에서 조절
export const FACE_RULES = {
  minImageSide: 320,      // 너무 작은 이미지
  minFaceWidthRatio: 0.18, // 얼굴 폭 / 이미지 폭 — 이보다 작으면 "너무 멀리서"
  maxNoseOffset: 0.28,     // |코 x − 두 눈 중점 x| / 눈 사이 거리 — 클수록 측면
  earRatioRange: [0.45, 2.2] as const, // (코−오른귀)/(왼귀−코) — 정면이면 1 근처
  minSharpness: 25,        // 얼굴 영역 라플라시안 분산 — 낮으면 흐림
};

// MediaPipe 번들은 Metro가 처리하지 못하는 동적 import를 쓰므로 번들에 넣지 않고 런타임에 CDN 모듈로 로드한다
const CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Vision = any;
declare global { interface Window { __mpVision?: Vision } }

function loadVision(): Promise<Vision> {
  if (window.__mpVision) return Promise.resolve(window.__mpVision);
  return new Promise((res, rej) => {
    const el = document.createElement('script');
    el.type = 'module';
    el.textContent = `import * as v from '${CDN}/vision_bundle.mjs'; window.__mpVision = v; window.dispatchEvent(new Event('mp-vision-ready'));`;
    const done = () => { cleanup(); window.__mpVision ? res(window.__mpVision) : rej(new Error('vision_load')); };
    const fail = () => { cleanup(); rej(new Error('vision_load')); };
    const timer = setTimeout(() => { cleanup(); rej(new Error('vision_timeout')); }, 25000);
    const cleanup = () => { clearTimeout(timer); window.removeEventListener('mp-vision-ready', done); el.removeEventListener('error', fail); };
    window.addEventListener('mp-vision-ready', done);
    el.addEventListener('error', fail);
    document.head.appendChild(el);
  });
}

let detectorPromise: Promise<Vision> | null = null;
async function getDetector(): Promise<Vision> {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const vision = await loadVision();
      const files = await vision.FilesetResolver.forVisionTasks(WASM_BASE);
      return vision.FaceDetector.createFromOptions(files, {
        baseOptions: { modelAssetPath: MODEL },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.5,
      });
    })().catch((e) => { detectorPromise = null; throw e; });
  }
  return detectorPromise;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('image_load'));
    img.src = src;
  });
}

/** 얼굴 영역의 선명도 — 그레이스케일 라플라시안 분산 */
function sharpnessOf(img: HTMLImageElement, box: { originX: number; originY: number; width: number; height: number }): number {
  const w = Math.max(8, Math.min(160, Math.round(box.width))), h = Math.max(8, Math.min(160, Math.round(box.height)));
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d'); if (!ctx) return 999;
  ctx.drawImage(img, box.originX, box.originY, box.width, box.height, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const g = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  let sum = 0, sq = 0, n = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    const lap = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w];
    sum += lap; sq += lap * lap; n++;
  }
  const mean = sum / n;
  return sq / n - mean * mean;
}

export async function checkFacePhoto(src: string): Promise<FaceCheck> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return { ok: true, status: 'unavailable' };
  let img: HTMLImageElement;
  try { img = await loadImage(src); } catch { return { ok: false, status: 'rejected', reason: '사진을 읽을 수 없어요. 다른 사진으로 시도해 주세요.' }; }
  if (Math.min(img.naturalWidth, img.naturalHeight) < FACE_RULES.minImageSide) {
    return { ok: false, status: 'rejected', reason: '사진이 너무 작아요. 더 큰 사진으로 올려 주세요.' };
  }
  let det: Vision;
  try { det = await getDetector(); } catch { return { ok: true, status: 'unavailable' }; }
  const result = det.detect(img);
  type Det = { boundingBox?: { originX: number; originY: number; width: number; height: number }; keypoints?: { x: number; y: number }[] };
  const faces = (result.detections as Det[]).filter((d) => d.boundingBox && d.boundingBox.width > 0);
  const base = { faces: faces.length, faceWidthRatio: 0, frontal: 0, earSymmetry: 0, sharpness: 0, imageW: img.naturalWidth, imageH: img.naturalHeight };
  if (faces.length === 0) return { ok: false, status: 'rejected', reason: '얼굴이 보이지 않아요. 정면 얼굴이 잘 나온 사진으로 올려 주세요.', metrics: base };
  if (faces.length > 1) return { ok: false, status: 'rejected', reason: '한 사람만 나온 사진으로 올려 주세요.', metrics: base };
  const f = faces[0], box = f.boundingBox!;
  const ratio = box.width / img.naturalWidth;
  const kp = f.keypoints; // 0 오른눈 1 왼눈 2 코 3 입 4 오른귀 5 왼귀 (정규화 좌표)
  let noseOffset = 0, earRatio = 1;
  if (kp && kp.length >= 6) {
    const eyeMid = (kp[0].x + kp[1].x) / 2, eyeDist = Math.abs(kp[1].x - kp[0].x) || 1e-6;
    noseOffset = Math.abs(kp[2].x - eyeMid) / eyeDist;
    const r = kp[2].x - kp[4].x, l = kp[5].x - kp[2].x;
    earRatio = l > 1e-6 ? Math.abs(r) / l : 99;
  }
  const sharp = sharpnessOf(img, box);
  const metrics = { ...base, faceWidthRatio: +ratio.toFixed(3), frontal: +(1 - Math.min(1, noseOffset)).toFixed(3), earSymmetry: +earRatio.toFixed(2), sharpness: +sharp.toFixed(1) };
  if (ratio < FACE_RULES.minFaceWidthRatio) return { ok: false, status: 'rejected', reason: '너무 멀리서 찍은 사진이에요. 얼굴이 더 크게 나오게 올려 주세요.', metrics };
  if (noseOffset > FACE_RULES.maxNoseOffset || earRatio < FACE_RULES.earRatioRange[0] || earRatio > FACE_RULES.earRatioRange[1]) {
    return { ok: false, status: 'rejected', reason: '측면 사진이에요. 정면을 보고 찍은 사진으로 올려 주세요.', metrics };
  }
  if (sharp < FACE_RULES.minSharpness) return { ok: false, status: 'rejected', reason: '사진이 흐려요. 선명한 사진으로 올려 주세요.', metrics };
  return { ok: true, status: 'auto_ok', metrics };
}
