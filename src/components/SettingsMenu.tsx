import React, { useEffect, useState } from 'react';
import { X, Settings, Trash2, Clock, Hash, MapPin, Cpu, Filter } from 'lucide-react';
import { SettingsFields, SearchHistory } from '../types';
import Pagination from './Pagination';

interface Props {
  settings: SettingsFields;
  onChange: (settings: SettingsFields) => void;
  onClose: () => void;
  onHistorySelect: (history: SearchHistory) => void;
}

const FIELD_GROUPS: { title: string; fields: { key: keyof SettingsFields; label: string }[] }[] = [
  {
    title: '기본 정보',
    fields: [
      { key: 'elvtrStts', label: '승강기 상태' },
      { key: 'elvtrDivNm', label: '승강기 구분' },
      { key: 'elvtrFormNm', label: '승강기 형식' },
      { key: 'elvtrKindNm', label: '승강기 종류' },
      { key: 'elvtrModel', label: '모델명' },
      { key: 'installationPlace', label: '설치 위치' },
      { key: 'shuttleSection', label: '운행 구간' },
    ],
  },
  {
    title: '설치 · 검사',
    fields: [
      { key: 'frstInstallationDe', label: '최초설치일' },
      { key: 'installationDe', label: '설치일자' },
      { key: 'lastInspctDe', label: '최종 검사일' },
      { key: 'lastInspctKind', label: '최종 검사종류' },
      { key: 'inspctInstt', label: '검사 기관' },
    ],
  },
  {
    title: '기술 제원',
    fields: [
      { key: 'divGroundFloorCnt', label: '지상 운행층수' },
      { key: 'divUndgrndFloorCnt', label: '지하 운행층수' },
      { key: 'ratedSpeed', label: '정격 속도' },
      { key: 'ratedCap', label: '정원' },
      { key: 'liveLoad', label: '적재하중' },
      { key: 'mrYn', label: '기계실 여부' },
    ],
  },
  {
    title: '유지관리',
    fields: [
      { key: 'subcntrCpny', label: '보수업체명' },
      { key: 'mntCpnyNm', label: '유지관리업체' },
      { key: 'mntCpnyTelno', label: '유지관리 연락처' },
      { key: 'partcpntNm', label: '관리주체명' },
      { key: 'partcpntTelno', label: '관리주체 연락처' },
    ],
  },
];

const HISTORY_PER_PAGE = 5;

export default function SettingsMenu({ settings, onChange, onClose, onHistorySelect }: Props) {
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    const stored = localStorage.getItem('elevatorSearchHistory');
    if (stored) {
      try {
        setHistory(JSON.parse(stored).slice(-50));
      } catch (_) {}
    }
  }, []);

  const toggle = (key: keyof SettingsFields) => {
    onChange({ ...settings, [key]: !settings[key] });
  };

  const allOn = Object.values(settings).every(Boolean);
  const toggleAll = () => {
    const next = !allOn;
    const updated = { ...settings };
    for (const k of Object.keys(settings) as (keyof SettingsFields)[]) {
      updated[k] = next;
    }
    onChange(updated);
  };

  const clearHistory = () => {
    localStorage.removeItem('elevatorSearchHistory');
    setHistory([]);
    setHistoryPage(1);
  };

  const handleHistoryClick = (h: SearchHistory) => {
    onHistorySelect(h);
    onClose();
  };

  const reversedHistory = [...history].reverse();
  const historyTotalPages = Math.ceil(reversedHistory.length / HISTORY_PER_PAGE);
  const historyStartIdx = (historyPage - 1) * HISTORY_PER_PAGE;
  const pageHistoryItems = reversedHistory.slice(historyStartIdx, historyStartIdx + HISTORY_PER_PAGE);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mt-auto bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-blue-600" />
            <h3 className="text-base font-bold text-gray-900">설정</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-3 pb-8 space-y-5">
          {/* Search History */}
          <div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full mb-3"
            >
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-500" />
                <h4 className="text-sm font-bold text-gray-800">검색/조회 히스토리</h4>
                {history.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full font-bold">
                    {history.length}
                  </span>
                )}
              </div>
              <span className="text-gray-400">{showHistory ? '▼' : '▶'}</span>
            </button>

            {showHistory && (
              <div>
                {history.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">히스토리 없음</p>
                ) : (
                  <>
                    <div className="space-y-1.5 mb-3">
                      {pageHistoryItems.map((h, idx) => {
                        const isView = h.type === 'view';
                        return (
                          <button
                            key={historyStartIdx + idx}
                            onClick={() => handleHistoryClick(h)}
                            className="w-full flex items-start justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                {isView ? (
                                  <Hash size={11} className="text-blue-500 shrink-0" />
                                ) : (
                                  <MapPin size={11} className="text-emerald-500 shrink-0" />
                                )}
                                <p className="text-xs font-medium text-gray-700 truncate">
                                  {h.query}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1 ml-5">
                                {h.elvtrModel && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    <Cpu size={8} />
                                    {h.elvtrModel}
                                  </span>
                                )}
                                {h.filters && Object.entries(h.filters).map(([k, v]) => (
                                  v && (
                                    <span key={k} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                                      <Filter size={8} />
                                      {k}: {v}
                                    </span>
                                  )
                                ))}
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5 ml-5">
                                {new Date(h.timestamp).toLocaleString('ko-KR')}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {historyTotalPages > 1 && (
                      <Pagination
                        currentPage={historyPage}
                        totalPages={historyTotalPages}
                        onPageChange={setHistoryPage}
                      />
                    )}
                  </>
                )}

                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors mt-2"
                  >
                    <Trash2 size={12} />
                    히스토리 삭제
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Display Fields */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-800">표시 항목</h4>
              <button
                onClick={toggleAll}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                {allOn ? '전체 해제' : '전체 선택'}
              </button>
            </div>
            <div className="space-y-3">
              {FIELD_GROUPS.map((group) => (
                <div key={group.title}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{group.title}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {group.fields.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => toggle(key)}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all text-xs ${
                          settings[key]
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            settings[key] ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                          }`}
                        >
                          {settings[key] && (
                            <svg viewBox="0 0 10 8" width="6" height="5" fill="none">
                              <path
                                d="M1 4l3 3 5-6"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="font-medium leading-tight">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
