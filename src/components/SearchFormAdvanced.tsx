import React from 'react';
import { Search, Sliders, Hash, MapPin } from 'lucide-react';
import { SearchTab } from '../types';

interface Props {
  tab: SearchTab;
  onTabChange: (tab: SearchTab) => void;
  elevatorNoQuery: string;
  onElevatorNoQueryChange: (q: string) => void;
  sido: string;
  onSidoChange: (s: string) => void;
  sigungu: string;
  onSigunguChange: (s: string) => void;
  building: string;
  onBuildingChange: (b: string) => void;
  onSearch: () => void;
  loading: boolean;
  onFilterClick: () => void;
}

export default function SearchFormAdvanced({
  tab,
  onTabChange,
  elevatorNoQuery,
  onElevatorNoQueryChange,
  sido,
  onSidoChange,
  sigungu,
  onSigunguChange,
  building,
  onBuildingChange,
  onSearch,
  loading,
  onFilterClick,
}: Props) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div className="bg-white px-4 pt-4 pb-3 shadow-sm space-y-2">
      {/* Tab Switcher */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-2">
        <button
          onClick={() => onTabChange('elevatorNo')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'elevatorNo'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Hash size={14} />
          고유번호 검색
        </button>
        <button
          onClick={() => onTabChange('address')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'address'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MapPin size={14} />
          도로명 주소 검색
        </button>
      </div>

      {tab === 'elevatorNo' ? (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">승강기 고유번호 (7자리)</label>
          <input
            type="text"
            value={elevatorNoQuery}
            onChange={(e) => onElevatorNoQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="예: 1234567"
            maxLength={7}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      ) : (
        <>
          {/* Row 1: Sido (20%) + 도로명주소 mapped to sigungu API param (80%) */}
          <div className="flex gap-2">
            <div className="w-[20%] shrink-0">
              <label className="block text-xs font-semibold text-gray-600 mb-1">시/도</label>
              <input
                type="text"
                value={sido}
                onChange={(e) => onSidoChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="예: 경기"
                className="w-full px-2 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="w-[80%]">
              <label className="block text-xs font-semibold text-gray-600 mb-1">도로명주소</label>
              <input
                type="text"
                value={sigungu}
                onChange={(e) => onSigunguChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="예: 신평화로"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Row 2: Building */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">건물명</label>
            <input
              type="text"
              value={building}
              onChange={(e) => onBuildingChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="건물명 (선택)"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </>
      )}

      {/* Search buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onSearch}
          disabled={loading}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 0 018-8v8z" />
              </svg>
              검색 중
            </>
          ) : (
            <>
              <Search size={16} />
              검색
            </>
          )}
        </button>
        {tab === 'address' && (
          <button
            onClick={onFilterClick}
            className="px-4 py-3 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Sliders size={16} />
            필터
          </button>
        )}
      </div>
    </div>
  );
}
