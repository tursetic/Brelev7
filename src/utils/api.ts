import { Elevator, InspectionRecord } from '../types';

const SERVICE_KEY = 'dacb12c7e73fb2551105593c7e389df3fbc7b235a1ccf46a22f26ce3de5a2713';
const BASE = 'https://apis.data.go.kr/B553664/ElevatorInformationService';

// In-memory cache with TTL: avoids redundant network calls for the same query/page
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const searchCache = new Map<string, { data: { items: Elevator[]; totalCount: number }; expiry: number }>();
const inspectCache = new Map<string, { data: { records: InspectionRecord[]; totalCount: number }; expiry: number }>();

function getCached<T>(cache: Map<string, { data: T; expiry: number }>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached<T>(cache: Map<string, { data: T; expiry: number }>, key: string, data: T): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

function getText(el: Element, tag: string): string {
  return el.querySelector(tag)?.textContent?.trim() ?? '';
}

function parseElevatorItem(item: Element): Elevator {
  return {
    elevatorNo: getText(item, 'elevatorNo'),
    buldNm: getText(item, 'buldNm'),
    address1: getText(item, 'address1'),
    address2: getText(item, 'address2'),
    elvtrDivNm: getText(item, 'elvtrDivNm'),
    elvtrFormNm: getText(item, 'elvtrFormNm'),
    elvtrKindNm: getText(item, 'elvtrKindNm'),
    elvtrModel: getText(item, 'elvtrModel'),
    elvtrStts: getText(item, 'elvtrStts'),
    frstInstallationDe: getText(item, 'frstInstallationDe'),
    installationDe: getText(item, 'installationDe'),
    lastInspctDe: getText(item, 'lastInspctDe'),
    lastInspctKind: getText(item, 'lastInspctKind'),
    inspctInstt: getText(item, 'inspctInstt'),
    lastResultNm: getText(item, 'lastResultNm'),
    divGroundFloorCnt: getText(item, 'divGroundFloorCnt'),
    divUndgrndFloorCnt: getText(item, 'divUndgrndFloorCnt'),
    shuttleFloorCnt: getText(item, 'shuttleFloorCnt'),
    ratedSpeed: getText(item, 'ratedSpeed'),
    ratedCap: getText(item, 'ratedCap'),
    liveLoad: getText(item, 'liveLoad'),
    installationPlace: getText(item, 'installationPlace'),
    shuttleSection: getText(item, 'shuttleSection'),
    manufacturerName: getText(item, 'manufacturerName'),
    elvtrAsignNo: getText(item, 'elvtrAsignNo'),
    mrYn: getText(item, 'mrYn'),
    applcBeDt: getText(item, 'applcBeDt'),
    applcEnDt: getText(item, 'applcEnDt'),
    pauseAblDe: getText(item, 'pauseAblDe'),
    pauseAbleResn: getText(item, 'pauseAbleResn'),
    subcntrCpny: getText(item, 'subcntrCpny'),
    mntCpnyNm: getText(item, 'mntCpnyNm'),
    mntCpnyTelno: getText(item, 'mntCpnyTelno'),
    partcpntNm: getText(item, 'partcpntNm'),
    partcpntTelno: getText(item, 'partcpntTelno'),
  };
}

async function fetchXml(url: string, signal?: AbortSignal): Promise<Document> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  return new DOMParser().parseFromString(text, 'text/xml');
}

export async function searchByElevatorNo(elevatorNo: string, pageNo: number = 1, signal?: AbortSignal): Promise<{ items: Elevator[], totalCount: number }> {
  const cacheKey = `elev:${elevatorNo}:${pageNo}`;
  const cached = getCached(searchCache, cacheKey);
  if (cached) return cached;

  const url = `${BASE}/getElevatorViewM?serviceKey=${SERVICE_KEY}&elevator_no=${elevatorNo}&numOfRows=100&pageNo=${pageNo}`;
  const doc = await fetchXml(url, signal);
  const totalCount = parseInt(doc.querySelector('totalCount')?.textContent ?? '0', 10);
  const items = Array.from(doc.querySelectorAll('item')).map(parseElevatorItem);
  const result = { items, totalCount };
  setCached(searchCache, cacheKey, result);
  return result;
}

export async function searchByAddress(params: {
  sido?: string;
  sigungu?: string;
  buldNm?: string;
  pageNo?: number;
  signal?: AbortSignal;
}): Promise<{ items: Elevator[], totalCount: number }> {
  const pageNo = params.pageNo ?? 1;
  const cacheKey = `addr:${params.sido || ''}:${params.sigungu || ''}:${params.buldNm || ''}:${pageNo}`;
  const cached = getCached(searchCache, cacheKey);
  if (cached) return cached;

  const query = new URLSearchParams({
    serviceKey: SERVICE_KEY,
    numOfRows: '100',
    pageNo: pageNo.toString(),
  });
  if (params.sido) query.set('sido', params.sido);
  if (params.sigungu) query.set('sigungu', params.sigungu);
  if (params.buldNm) query.set('buld_nm', params.buldNm);

  const url = `${BASE}/getElevatorListM?${query.toString()}`;
  const doc = await fetchXml(url, params.signal);
  const totalCount = parseInt(doc.querySelector('totalCount')?.textContent ?? '0', 10);
  const items = Array.from(doc.querySelectorAll('item')).map(parseElevatorItem);
  const result = { items, totalCount };
  setCached(searchCache, cacheKey, result);
  return result;
}

export async function fetchInspectionHistory(elevatorNo: string, pageNo: number = 1, signal?: AbortSignal): Promise<{ records: InspectionRecord[], totalCount: number }> {
  const cacheKey = `insp:${elevatorNo}:${pageNo}`;
  const cached = getCached(inspectCache, cacheKey);
  if (cached) return cached;

  const url = `${BASE}/getElvtrInspctInqireM?serviceKey=${SERVICE_KEY}&elevator_no=${elevatorNo}&numOfRows=100&pageNo=${pageNo}`;
  const doc = await fetchXml(url, signal);
  const totalCount = parseInt(doc.querySelector('totalCount')?.textContent ?? '0', 10);
  const items = Array.from(doc.querySelectorAll('item')).map((item) => ({
    applcBeDt: getText(item, 'applcBeDt'),
    applcEnDt: getText(item, 'applcEnDt'),
    inspctDt: getText(item, 'inspctDt'),
    inspctKind: getText(item, 'inspctKind'),
    psexamYn: getText(item, 'psexamYn'),
    inspctInsttNm: getText(item, 'inspctInsttNm'),
  }));
  const sorted = items.sort((a, b) => b.inspctDt.localeCompare(a.inspctDt));
  const result = { records: sorted, totalCount };
  setCached(inspectCache, cacheKey, result);
  return result;
}

// Singleton promise so kakao.maps.load() is called at most once
let kakaoLoadPromise: Promise<void> | null = null;

export function ensureKakaoReady(): Promise<void> {
  if (kakaoLoadPromise) return kakaoLoadPromise;
  kakaoLoadPromise = new Promise<void>((resolve, reject) => {
    const TIMEOUT_MS = 3000;
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      kakaoLoadPromise = null; // allow retry next time
      reject(new Error('Kakao SDK Load Timeout'));
    }, TIMEOUT_MS);

    const wait = () => {
      const kakao = (window as any).kakao;
      if (kakao && typeof kakao.maps?.load === 'function') {
        kakao.maps.load(() => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve();
        });
      } else {
        setTimeout(wait, 100);
      }
    };
    wait();
  });
  return kakaoLoadPromise;
}

export function geocodeAddress(address: string, signal?: AbortSignal): Promise<[number, number] | null> {
  if (signal?.aborted) return Promise.resolve(null);

  return ensureKakaoReady()
    .then(() => {
      if (signal?.aborted) return null;
      return new Promise<[number, number] | null>((resolve) => {
        const kakao = (window as any).kakao;
        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.addressSearch(address, (result: any[], status: string) => {
          if (signal?.aborted) { resolve(null); return; }
          if (status === 'OK' && result.length > 0) {
            resolve([parseFloat(result[0].y), parseFloat(result[0].x)]);
          } else {
            resolve(null);
          }
        });
      });
    })
    .catch((err) => {
      console.error('[geocodeAddress] Kakao SDK error:', err);
      return null;
    });
}
