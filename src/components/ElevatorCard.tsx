import React from 'react';
import { Star, AlertTriangle, ChevronRight } from 'lucide-react';
import { ElevatorWithBadges, SettingsFields } from '../types';
import { checkShuttleSection, formatDate, formatRatedSpeed, getStatusBadgeClass } from '../utils/elevatorHelpers';

interface Props {
  elevator: ElevatorWithBadges;
  settings: SettingsFields;
  onClick: () => void;
}

export default function ElevatorCard({ elevator: el, settings: s, onClick }: Props) {
  const shuttle = checkShuttleSection(el.shuttleSection);
  const hasReplacement = el.frstInstallationDe && el.installationDe && el.frstInstallationDe !== el.installationDe;
  const statusBadgeClass = getStatusBadgeClass(el.elvtrStts || '');

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 px-3.5 py-2.5 cursor-pointer hover:shadow-md hover:border-blue-100 active:scale-[0.99] transition-all"
    >
      {/* Top row: building name + badges */}
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className="font-bold text-gray-900 text-sm truncate">{el.buldNm || '건물명 없음'}</span>
          {el.isTopGround && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full border border-amber-200 shrink-0">
              <Star size={8} fill="currentColor" />지상↑
            </span>
          )}
          {el.isDeepUnderground && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-sky-50 text-sky-600 text-[10px] font-bold rounded-full border border-sky-200 shrink-0">
              <Star size={8} fill="currentColor" />지하↓
            </span>
          )}
          {!shuttle.valid && el.shuttleSection && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 text-yellow-600 text-[10px] font-bold rounded-full border border-yellow-200 shrink-0">
              <AlertTriangle size={8} />특이
            </span>
          )}
        </div>
        <ChevronRight size={14} className="text-gray-300 shrink-0 mt-0.5" />
      </div>

      {/* Address */}
      <p className="text-[11px] text-gray-400 truncate mb-1.5">
        {el.address1}{el.address2 ? ` · ${el.address2}` : ''}
      </p>

      {/* Key info row: 승번 / 호기+설치장소 merged / 운행구간 */}
      <div className="flex items-center gap-1 flex-wrap mb-1.5">
        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded border border-blue-100">
          {el.elevatorNo}
        </span>
        {el.elvtrAsignNo ? (
          <span className="px-1.5 py-0.5 bg-cyan-50 text-cyan-700 text-[11px] font-semibold rounded border border-cyan-100 truncate max-w-[160px]">
            {el.elvtrAsignNo}호기{el.installationPlace ? ` ${el.installationPlace}` : ''}
          </span>
        ) : el.installationPlace ? (
          <span className="px-1.5 py-0.5 bg-cyan-50 text-cyan-700 text-[11px] font-semibold rounded border border-cyan-100 truncate max-w-[160px]">
            {el.installationPlace}
          </span>
        ) : null}
        {el.shuttleSection && (
          <span className="px-1.5 py-0.5 bg-gray-50 text-gray-500 text-[11px] font-medium rounded border border-gray-200 truncate max-w-[100px]">
            {el.shuttleSection}
          </span>
        )}
      </div>

      {/* Spec row: manufacturer / model / speed / load */}
      {(el.manufacturerName || el.elvtrModel || el.ratedSpeed || el.liveLoad) && (
        <div className="flex items-center gap-1 flex-wrap mb-1.5 text-[11px] text-gray-500">
          {el.manufacturerName && <span className="font-medium">{el.manufacturerName}</span>}
          {el.manufacturerName && el.elvtrModel && <span className="text-gray-300">·</span>}
          {el.elvtrModel && <span className="font-medium truncate max-w-[120px]">{el.elvtrModel}</span>}
          {(el.manufacturerName || el.elvtrModel) && el.ratedSpeed && <span className="text-gray-300">·</span>}
          {el.ratedSpeed && <span>{formatRatedSpeed(el.ratedSpeed)}</span>}
          {el.liveLoad && <><span className="text-gray-300">·</span><span>{el.liveLoad}</span></>}
        </div>
      )}

      {/* Bottom row: status / kind / div / date */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          {s.elvtrStts && el.elvtrStts && (
            <span className={`px-1.5 py-0.5 text-[11px] font-bold rounded border ${statusBadgeClass}`}>
              {el.elvtrStts}
            </span>
          )}
          {s.elvtrKindNm && el.elvtrKindNm && (
            <span className="px-1.5 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 rounded">
              {el.elvtrKindNm}
            </span>
          )}
          {s.elvtrDivNm && el.elvtrDivNm && (
            <span className="px-1.5 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 rounded">
              {el.elvtrDivNm}
            </span>
          )}
        </div>
        <div className="text-right shrink-0">
          {hasReplacement ? (
            <span className="text-[10px] text-amber-600 font-semibold">교체 {formatDate(el.installationDe)}</span>
          ) : el.installationDe ? (
            <span className="text-[10px] text-gray-400">{formatDate(el.installationDe)}</span>
          ) : el.frstInstallationDe ? (
            <span className="text-[10px] text-gray-400">{formatDate(el.frstInstallationDe)}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
