import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { FilterOptions } from '../types';

interface Props {
  filters: FilterOptions;
  selected: Record<string, string[]>;
  onFilterChange: (key: string, values: string[]) => void;
  onClose: () => void;
  modelKeyword: string;
  onModelKeywordChange: (v: string) => void;
  minGroundFloor: string;
  onMinGroundFloorChange: (v: string) => void;
  minSpeed: string;
  onMinSpeedChange: (v: string) => void;
  hideEscalator: boolean;
  onHideEscalatorChange: (v: boolean) => void;
}

interface FilterSection {
  key: keyof FilterOptions;
  label: string;
  hasTextInput?: 'keyword' | 'number' | 'speed';
}

const FILTER_SECTIONS: FilterSection[] = [
  { key: 'elvtrModel', label: '모델명', hasTextInput: 'keyword' },
  { key: 'divGroundFloorCnt', label: '지상층', hasTextInput: 'number' },
  { key: 'ratedSpeed', label: '정격 속도 (m/min)', hasTextInput: 'speed' },
  { key: 'manufacturerName', label: '제조업체' },
  { key: 'installationYear', label: '설치 연도' },
  { key: 'liveLoad', label: '적재하중' },
  { key: 'elvtrDivNm', label: '승강기 구분' },
  { key: 'elvtrFormNm', label: '승강기 형식' },
  { key: 'elvtrKindNm', label: '승강기 종류' },
  { key: 'elvtrStts', label: '상태' },
  { key: 'lastResultNm', label: '최종 검사 결과' },
];

// Groups that should be sorted by leading numeric value (descending)
const NUMERIC_SORT_KEYS = new Set([
  'divGroundFloorCnt',
  'ratedSpeed',
  'liveLoad',
  'installationYear',
]);

function parseLeadingNumber(str: string): number {
  const match = str.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

export default function FilterSidebar({
  filters,
  selected,
  onFilterChange,
  onClose,
  modelKeyword,
  onModelKeywordChange,
  minGroundFloor,
  onMinGroundFloorChange,
  minSpeed,
  onMinSpeedChange,
  hideEscalator,
  onHideEscalatorChange,
}: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(Object.keys(filters)));

  const toggleSection = (key: string) => {
    const next = new Set(expandedSections);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setExpandedSections(next);
  };

  const toggleValue = (key: string, value: string) => {
    const current = selected[key] ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onFilterChange(key, next);
  };

  const clearAll = () => {
    FILTER_SECTIONS.forEach(({ key }) => {
      onFilterChange(key, []);
    });
    onModelKeywordChange('');
    onMinGroundFloorChange('');
    onMinSpeedChange('');
    onHideEscalatorChange(true);
  };

  const getSortedValues = (key: keyof FilterOptions): string[] => {
    const values = filters[key];
    if (!values || values.length === 0) return [];

    if (NUMERIC_SORT_KEYS.has(key)) {
      return [...values].sort((a, b) => parseLeadingNumber(b) - parseLeadingNumber(a));
    }
    return [...values].sort((a, b) => a.localeCompare(b, 'ko'));
  };

  return (
    <div className="fixed inset-0 z-50 flex" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto bg-white w-80 max-w-[85vw] h-screen flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-bold text-gray-900">필터</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={clearAll}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              초기화
            </button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-3 py-2 pb-6">
          <div className="space-y-1">
            {/* Escalator toggle — always shown */}
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => onHideEscalatorChange(!hideEscalator)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <p className="text-xs font-semibold text-gray-700">에스컬레이터 숨기기</p>
                <div
                  className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
                    hideEscalator ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      hideEscalator ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </button>
            </div>

            {FILTER_SECTIONS.map(({ key, label, hasTextInput }) => {
              const values = getSortedValues(key);
              if (!values || values.length === 0) return null;

              const isExpanded = expandedSections.has(key);
              const selectedCount = (selected[key] ?? []).length;

              return (
                <div key={key} className="rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700">{label}</p>
                      {selectedCount > 0 && (
                        <p className="text-xs text-blue-600 mt-0.5">{selectedCount}개 선택됨</p>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={14} className="text-gray-500 shrink-0" />
                    ) : (
                      <ChevronDown size={14} className="text-gray-500 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-3 py-2 space-y-1.5">
                      {/* Text/number input at top of section */}
                      {hasTextInput === 'keyword' && (
                        <div className="relative mb-1">
                          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={modelKeyword}
                            onChange={(e) => onModelKeywordChange(e.target.value)}
                            placeholder="모델명 키워드 검색"
                            className="w-full pl-7 pr-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}
                      {hasTextInput === 'number' && (
                        <input
                          type="number"
                          value={minGroundFloor}
                          onChange={(e) => onMinGroundFloorChange(e.target.value)}
                          placeholder="최소 지상층 입력"
                          min="0"
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [appearance:textfield]"
                        />
                      )}
                      {hasTextInput === 'speed' && (
                        <input
                          type="number"
                          value={minSpeed}
                          onChange={(e) => onMinSpeedChange(e.target.value)}
                          placeholder="최소 속도 (m/min) 입력"
                          min="0"
                          step="0.1"
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [appearance:textfield]"
                        />
                      )}

                      {/* Checkbox list */}
                      <div className="max-h-48 overflow-y-auto space-y-0.5">
                        {values.map((value) => {
                          const isSelected = (selected[key] ?? []).includes(value);
                          return (
                            <button
                              key={value}
                              onClick={() => toggleValue(key, value)}
                              className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs text-left transition-colors ${
                                isSelected
                                  ? 'bg-blue-50 text-blue-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                  isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                }`}
                              >
                                {isSelected && (
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
                              <span className="truncate">{value}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
