import { Elevator, ElevatorWithBadges, FilterOptions } from '../types';

export function assignBadges(elevators: Elevator[]): ElevatorWithBadges[] {
  // Badges are meaningless for a single elevator (e.g. 고유번호 search)
  if (elevators.length <= 1) {
    return elevators.map((el) => ({
      ...el,
      isTopGround: false,
      isDeepUnderground: false,
    }));
  }

  const groups: Record<string, Elevator[]> = {};
  for (const el of elevators) {
    const key = el.buldNm || '_unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(el);
  }

  const result: ElevatorWithBadges[] = [];

  for (const group of Object.values(groups)) {
    // A group of only 1 elevator should not get badges either
    const singleInGroup = group.length <= 1;
    const maxGround = Math.max(...group.map((e) => parseInt(e.divGroundFloorCnt) || 0));
    const maxUnderground = Math.max(...group.map((e) => parseInt(e.divUndgrndFloorCnt) || 0));

    for (const el of group) {
      const groundFloors = parseInt(el.divGroundFloorCnt) || 0;
      const undergroundFloors = parseInt(el.divUndgrndFloorCnt) || 0;
      result.push({
        ...el,
        isTopGround: !singleInGroup && maxGround > 0 && groundFloors === maxGround,
        isDeepUnderground: !singleInGroup && maxUnderground > 0 && undergroundFloors === maxUnderground,
      });
    }
  }

  return result;
}

export function sortElevators(elevators: Elevator[]): Elevator[] {
  return [...elevators].sort((a, b) => {
    const nameCompare = (a.buldNm || '').localeCompare(b.buldNm || '', 'ko');
    if (nameCompare !== 0) return nameCompare;
    // Natural/numeric sort by 호기 (elvtrAsignNo)
    const aNo = a.elvtrAsignNo || '';
    const bNo = b.elvtrAsignNo || '';
    const aNum = parseInt(aNo, 10);
    const bNum = parseInt(bNo, 10);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    if (!isNaN(aNum)) return -1;
    if (!isNaN(bNum)) return 1;
    return aNo.localeCompare(bNo, 'ko');
  });
}

export function checkShuttleSection(section: string): { valid: boolean; raw: string } {
  if (!section || section.trim() === '' || section === '-') {
    return { valid: true, raw: section };
  }
  // Valid: only digits, 'B' (upper/lower), hyphens, tildes, spaces, commas
  const valid = /^[0-9Bb\-~\s,]+$/.test(section.trim());
  return { valid, raw: section };
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  // If already formatted with hyphens, return as-is
  if (dateStr.includes('-')) return dateStr;
  // Otherwise format YYYYMMDD as YYYY-MM-DD
  if (dateStr.length === 8) return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  return dateStr;
}

function isPositiveStatus(status: string): boolean {
  if (status.includes('중지') || status.includes('정지')) return false;
  if (status.includes('운휴') || status.includes('일시')) return false;
  if (status.includes('폐지') || status.includes('말소')) return false;
  if (status.includes('정상') || status.includes('운행') || status.includes('사용')) return true;
  return false;
}

function isWarningStatus(status: string): boolean {
  return status.includes('운휴') || status.includes('일시') || status.includes('중지') || status.includes('정지');
}

function isDangerStatus(status: string): boolean {
  return status.includes('폐지') || status.includes('말소');
}

export function getStatusBadgeClass(status: string): string {
  if (!status) return 'bg-gray-100 text-gray-500 border-gray-200';
  if (isDangerStatus(status)) return 'bg-red-50 text-red-600 border-red-200';
  if (isWarningStatus(status)) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (isPositiveStatus(status)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return 'bg-gray-100 text-gray-500 border-gray-200';
}

export function getStatusHexColor(status: string | undefined | null): string {
  if (!status) return '#6b7280';
  if (status.includes('폐지') || status.includes('말소')) return '#dc2626';
  if (status.includes('운휴') || status.includes('일시') || status.includes('중지') || status.includes('정지')) return '#d97706';
  if (!status.includes('중지') && !status.includes('정지') && (status.includes('정상') || status.includes('운행') || status.includes('사용'))) return '#059669';
  return '#6b7280';
}

export function extractYear(dateStr: string): string {
  if (!dateStr) return '';
  // Extract first 4 chars (YYYY)
  return dateStr.slice(0, 4);
}

export function parseRatedSpeed(ratedSpeedStr: string): number | null {
  if (!ratedSpeedStr) return null;
  const match = ratedSpeedStr.match(/([\d.]+)/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  return isNaN(value) ? null : value * 60;
}

export function formatRatedSpeed(ratedSpeedStr: string): string {
  const speed = parseRatedSpeed(ratedSpeedStr);
  if (speed === null) return ratedSpeedStr || '-';
  return `${speed} m/min`;
}

export function collectFilterOptions(elevators: Elevator[]): FilterOptions {
  const filters: FilterOptions = {
    divGroundFloorCnt: [],
    manufacturerName: [],
    elvtrModel: [],
    installationYear: [],
    ratedSpeed: [],
    liveLoad: [],
    elvtrDivNm: [],
    elvtrFormNm: [],
    elvtrKindNm: [],
    elvtrStts: [],
    lastResultNm: [],
  };

  const seen = {
    divGroundFloorCnt: new Set<string>(),
    manufacturerName: new Set<string>(),
    elvtrModel: new Set<string>(),
    installationYear: new Set<string>(),
    ratedSpeed: new Set<string>(),
    liveLoad: new Set<string>(),
    elvtrDivNm: new Set<string>(),
    elvtrFormNm: new Set<string>(),
    elvtrKindNm: new Set<string>(),
    elvtrStts: new Set<string>(),
    lastResultNm: new Set<string>(),
  };

  for (const el of elevators) {
    if (el.divGroundFloorCnt && !seen.divGroundFloorCnt.has(el.divGroundFloorCnt)) {
      seen.divGroundFloorCnt.add(el.divGroundFloorCnt);
      filters.divGroundFloorCnt.push(el.divGroundFloorCnt);
    }
    if (el.manufacturerName && !seen.manufacturerName.has(el.manufacturerName)) {
      seen.manufacturerName.add(el.manufacturerName);
      filters.manufacturerName.push(el.manufacturerName);
    }
    if (el.elvtrModel && !seen.elvtrModel.has(el.elvtrModel)) {
      seen.elvtrModel.add(el.elvtrModel);
      filters.elvtrModel.push(el.elvtrModel);
    }
    if (el.installationDe) {
      const year = extractYear(el.installationDe);
      if (year && !seen.installationYear.has(year)) {
        seen.installationYear.add(year);
        filters.installationYear.push(year);
      }
    }
    if (el.ratedSpeed) {
      const display = formatRatedSpeed(el.ratedSpeed);
      if (!seen.ratedSpeed.has(display)) {
        seen.ratedSpeed.add(display);
        filters.ratedSpeed.push(display);
      }
    }
    if (el.liveLoad && !seen.liveLoad.has(el.liveLoad)) {
      seen.liveLoad.add(el.liveLoad);
      filters.liveLoad.push(el.liveLoad);
    }
    if (el.elvtrDivNm && !seen.elvtrDivNm.has(el.elvtrDivNm)) {
      seen.elvtrDivNm.add(el.elvtrDivNm);
      filters.elvtrDivNm.push(el.elvtrDivNm);
    }
    if (el.elvtrFormNm && !seen.elvtrFormNm.has(el.elvtrFormNm)) {
      seen.elvtrFormNm.add(el.elvtrFormNm);
      filters.elvtrFormNm.push(el.elvtrFormNm);
    }
    if (el.elvtrKindNm && !seen.elvtrKindNm.has(el.elvtrKindNm)) {
      seen.elvtrKindNm.add(el.elvtrKindNm);
      filters.elvtrKindNm.push(el.elvtrKindNm);
    }
    if (el.elvtrStts && !seen.elvtrStts.has(el.elvtrStts)) {
      seen.elvtrStts.add(el.elvtrStts);
      filters.elvtrStts.push(el.elvtrStts);
    }
    if (el.lastResultNm && !seen.lastResultNm.has(el.lastResultNm)) {
      seen.lastResultNm.add(el.lastResultNm);
      filters.lastResultNm.push(el.lastResultNm);
    }
  }

  // Sort all arrays
  for (const key of Object.keys(filters) as (keyof FilterOptions)[]) {
    filters[key].sort((a, b) => a.localeCompare(b, 'ko'));
  }

  return filters;
}
