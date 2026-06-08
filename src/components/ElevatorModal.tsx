import React, { useEffect, useState } from 'react';
import {
  X, MapPin, AlertTriangle, Loader2, ChevronDown, ChevronUp,
  Star, Shield, Building2
} from 'lucide-react';
import { ElevatorWithBadges, InspectionRecord, SettingsFields } from '../types';
import { fetchInspectionHistory } from '../utils/api';
import { checkShuttleSection, formatDate, formatRatedSpeed, getStatusBadgeClass } from '../utils/elevatorHelpers';

interface Props {
  elevator: ElevatorWithBadges;
  settings: SettingsFields;
  onClose: () => void;
}

function Row({ label, value, show = true }: { label: string; value?: string | null; show?: boolean }) {
  if (!show || !value || value.trim() === '' || value === '-') return null;
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 shrink-0 w-28">{label}</span>
      <span className="text-xs font-medium text-gray-800 text-right break-all">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const visibleCount = React.Children.toArray(children).filter(Boolean).length;
  if (visibleCount === 0) return null;
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className="w-1 h-3.5 bg-blue-500 rounded-full" />
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">{title}</h4>
      </div>
      <div className="bg-gray-50 rounded-xl px-3 py-0.5">{children}</div>
    </div>
  );
}

export default function ElevatorModal({ elevator: el, settings: s, onClose }: Props) {
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [loadingInspect, setLoadingInspect] = useState(true);
  const [showAllInspect, setShowAllInspect] = useState(false);

  useEffect(() => {
    setLoadingInspect(true);
    const controller = new AbortController();
    fetchInspectionHistory(el.elevatorNo, 1, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        const sorted = [...data.records].sort((a, b) => b.inspctDt.localeCompare(a.inspctDt));
        setInspections(sorted);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setInspections([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingInspect(false);
        }
      });
    return () => {
      controller.abort();
    };
  }, [el.elevatorNo]);

  const shuttle = checkShuttleSection(el.shuttleSection);
  const hasReplacement = el.frstInstallationDe && el.installationDe && el.frstInstallationDe !== el.installationDe;
  const recentEmergencyInspect = inspections.find((r) => r.inspctKind === '수시검사');
  const displayedInspections = showAllInspect ? inspections : inspections.slice(0, 5);

  const statusBadgeClass = getStatusBadgeClass(el.elvtrStts || '');

  // Check if any row in a section is visible
  const hasBasicInfo = s.elvtrDivNm || s.elvtrFormNm || s.elvtrKindNm || s.elvtrModel || s.elvtrStts;
  const hasInstallInfo = s.frstInstallationDe || s.installationDe;
  const hasTechSpec = s.divGroundFloorCnt || s.divUndgrndFloorCnt || s.ratedSpeed || s.ratedCap || s.liveLoad || s.mrYn || s.installationPlace || s.shuttleSection;
  const hasInspectInfo = s.lastInspctDe || s.lastInspctKind || s.inspctInstt;
  const hasMaintenanceInfo = s.subcntrCpny || s.mntCpnyNm || s.mntCpnyTelno || s.partcpntNm || s.partcpntTelno;
  const hasMaintenanceData = el.subcntrCpny || el.mntCpnyNm || el.mntCpnyTelno || el.partcpntNm || el.partcpntTelno;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative mt-auto bg-white rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-9 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Sticky Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-gray-100 px-4 py-2 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Building2 size={14} className="text-blue-500 shrink-0" />
                <h2 className="text-sm font-bold text-gray-900 truncate">{el.buldNm || '건물명 없음'}</h2>
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
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {s.elvtrStts && el.elvtrStts && (
                  <span className={`px-2 py-0.5 text-[11px] font-bold rounded border ${statusBadgeClass}`}>
                    {el.elvtrStts}
                  </span>
                )}
                {s.elvtrKindNm && el.elvtrKindNm && (
                  <span className="px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 rounded">
                    {el.elvtrKindNm}
                  </span>
                )}
                {s.elvtrDivNm && el.elvtrDivNm && (
                  <span className="px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 rounded">
                    {el.elvtrDivNm}
                  </span>
                )}
                {s.elvtrFormNm && el.elvtrFormNm && (
                  <span className="px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 rounded">
                    {el.elvtrFormNm}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors shrink-0">
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 py-3 pb-8 space-y-1">

          {/* Alert: 수시검사 */}
          {recentEmergencyInspect && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-2 mb-2">
              <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-red-700">최근 수시검사 이력</p>
                <p className="text-xs text-red-600 mt-0.5">
                  {formatDate(recentEmergencyInspect.inspctDt)}
                  {recentEmergencyInspect.inspctInsttNm && ` · ${recentEmergencyInspect.inspctInsttNm}`}
                </p>
              </div>
            </div>
          )}

          {/* Alert: 특이 운행구간 */}
          {!shuttle.valid && el.shuttleSection && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 flex items-center gap-2 mb-2">
              <AlertTriangle size={12} className="text-yellow-600 shrink-0" />
              <p className="text-xs font-semibold text-yellow-700">특이 운행구간: {el.shuttleSection}</p>
            </div>
          )}

          {/* Address */}
          <div className="bg-gray-50 rounded-xl px-3 py-2 flex items-start gap-2 mb-2">
            <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" />
            <div className="text-xs text-gray-600 leading-relaxed">
              {el.address1 && <span>{el.address1}</span>}
              {el.address2 && <span className="text-gray-400"> · {el.address2}</span>}
            </div>
          </div>

          {/* 기본 정보 */}
          {hasBasicInfo && (
            <Section title="기본 정보">
              <Row label="고유번호 (승번)" value={el.elevatorNo} />
              <Row label="승강기 호기" value={el.elvtrAsignNo} />
              <Row label="승강기 구분" value={el.elvtrDivNm} show={s.elvtrDivNm} />
              <Row label="승강기 형식" value={el.elvtrFormNm} show={s.elvtrFormNm} />
              <Row label="승강기 종류" value={el.elvtrKindNm} show={s.elvtrKindNm} />
              <Row label="모델명" value={el.elvtrModel} show={s.elvtrModel} />
              <Row label="설치장소" value={el.installationPlace} show={s.installationPlace} />
              <Row label="운행구간" value={el.shuttleSection} show={s.shuttleSection} />
            </Section>
          )}

          {/* 설치/제조 정보 */}
          {hasInstallInfo && (
            <Section title="설치 · 제조">
              <Row label="제조업체" value={el.manufacturerName} />
              {hasReplacement ? (
                <>
                  <Row label="최초설치일" value={formatDate(el.frstInstallationDe)} show={s.frstInstallationDe} />
                  <Row label="설치일 (교체)" value={formatDate(el.installationDe)} show={s.installationDe} />
                </>
              ) : (
                <>
                  <Row label="최초설치일" value={formatDate(el.frstInstallationDe)} show={s.frstInstallationDe} />
                  <Row label="설치일자" value={formatDate(el.installationDe)} show={s.installationDe} />
                </>
              )}
            </Section>
          )}

          {/* 기술 제원 */}
          {hasTechSpec && (
            <Section title="기술 제원">
              <Row label="지상층" value={el.divGroundFloorCnt} show={s.divGroundFloorCnt} />
              <Row label="지하층" value={el.divUndgrndFloorCnt} show={s.divUndgrndFloorCnt} />
              <Row label="운행층수" value={el.shuttleFloorCnt} show={s.divGroundFloorCnt || s.divUndgrndFloorCnt} />
              <Row label="정격속도" value={formatRatedSpeed(el.ratedSpeed)} show={s.ratedSpeed} />
              <Row label="최대정원" value={el.ratedCap} show={s.ratedCap} />
              <Row label="적재하중" value={el.liveLoad} show={s.liveLoad} />
              <Row label="기계실" value={el.mrYn === 'Y' ? '있음' : el.mrYn === 'N' ? '없음' : el.mrYn} show={s.mrYn} />
            </Section>
          )}

          {/* 검사 정보 */}
          {hasInspectInfo && (
            <Section title="검사 정보">
              <Row label="최종검사일" value={formatDate(el.lastInspctDe)} show={s.lastInspctDe} />
              <Row label="최종검사종류" value={el.lastInspctKind} show={s.lastInspctKind} />
              <Row label="검사 기관" value={el.inspctInstt} show={s.inspctInstt} />
              <Row label="최종검사결과" value={el.lastResultNm} />
              <Row label="운행유효기간" value={
                el.applcBeDt && el.applcEnDt
                  ? `${formatDate(el.applcBeDt)} ~ ${formatDate(el.applcEnDt)}`
                  : el.applcBeDt
                  ? formatDate(el.applcBeDt)
                  : el.applcEnDt
                  ? formatDate(el.applcEnDt)
                  : undefined
              } />
              {el.pauseAblDe && <Row label="휴폐지일자" value={formatDate(el.pauseAblDe)} />}
              {el.pauseAbleResn && <Row label="휴폐지사유" value={el.pauseAbleResn} />}
            </Section>
          )}

          {/* 유지관리 정보 */}
          {hasMaintenanceInfo && hasMaintenanceData && (
            <Section title="유지관리 정보">
              <Row label="하도급/공동수급" value={el.subcntrCpny} show={s.subcntrCpny} />
              <Row label="보수업체명" value={el.mntCpnyNm} show={s.mntCpnyNm} />
              <Row label="보수업체 연락처" value={el.mntCpnyTelno} show={s.mntCpnyTelno} />
              <Row label="관리주체명" value={el.partcpntNm} show={s.partcpntNm} />
              <Row label="관리주체 연락처" value={el.partcpntTelno} show={s.partcpntTelno} />
            </Section>
          )}

          {/* 검사 이력 */}
          <div className="mb-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-1 h-3.5 bg-blue-500 rounded-full" />
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">검사 이력</h4>
            </div>

            {loadingInspect ? (
              <div className="flex items-center justify-center py-5 gap-2">
                <Loader2 size={14} className="animate-spin text-blue-400" />
                <span className="text-xs text-gray-400">로딩 중...</span>
              </div>
            ) : inspections.length === 0 ? (
              <p className="text-center py-4 text-xs text-gray-400">검사 이력 없음</p>
            ) : (
              <div className="space-y-1">
                {displayedInspections.map((record, idx) => {
                  const isEmergency = record.inspctKind === '수시검사';
                  const isNotRegular = record.inspctKind !== '정기검사';
                  const isFailed = record.psexamYn === '불합격';
                  const isPassed = record.psexamYn === '합격';
                  const isConditional = record.psexamYn && !isPassed && !isFailed;

                  const cardBg = isFailed
                    ? 'bg-red-50 border-red-200'
                    : isEmergency
                    ? 'bg-violet-50 border-violet-200'
                    : isNotRegular
                    ? 'bg-gray-100 border-gray-300'
                    : 'bg-gray-50 border-gray-100';

                  const kindBadge = isEmergency
                    ? 'bg-violet-100 text-violet-700 border-violet-200'
                    : isNotRegular
                    ? 'bg-gray-200 text-gray-700 border-gray-300'
                    : 'bg-gray-50 text-gray-600 border-gray-200';

                  const resultChip = isFailed
                    ? 'bg-red-200 text-red-700'
                    : isConditional
                    ? 'bg-yellow-200 text-yellow-800'
                    : 'bg-green-100 text-green-700';

                  return (
                    <div key={idx} className={`rounded-lg px-2.5 py-2 border text-xs ${cardBg}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                            {isFailed ? (
                              <AlertTriangle size={10} className="text-red-600 shrink-0" />
                            ) : (
                              <Shield size={10} className={isFailed ? 'text-red-600' : isPassed ? 'text-green-600' : 'text-yellow-500'} />
                            )}
                            <span className={`px-1.5 py-0.5 rounded border text-[11px] font-bold ${kindBadge}`}>
                              {record.inspctKind || '-'}
                            </span>
                            {record.psexamYn && (
                              <span className={`px-1.5 py-0.5 rounded font-semibold text-[11px] ${resultChip}`}>
                                {record.psexamYn}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 truncate">{record.inspctInsttNm || '-'}</p>
                          {(record.applcBeDt || record.applcEnDt) && (
                            <p className="text-gray-400 mt-0.5">
                              운행: {formatDate(record.applcBeDt)} ~ {formatDate(record.applcEnDt)}
                            </p>
                          )}
                        </div>
                        <span className={`font-bold shrink-0 text-[11px] ${isFailed ? 'text-red-700' : 'text-gray-600'}`}>
                          {formatDate(record.inspctDt)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {inspections.length > 5 && (
                  <button
                    onClick={() => setShowAllInspect(!showAllInspect)}
                    className="w-full py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {showAllInspect ? (
                      <><ChevronUp size={12} />접기</>
                    ) : (
                      <><ChevronDown size={12} />더 보기 ({inspections.length - 5}건)</>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
