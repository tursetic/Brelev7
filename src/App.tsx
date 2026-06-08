import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Settings, Map as MapIcon, List, AlertCircle } from 'lucide-react';
import { Elevator as ElevatorType, ElevatorWithBadges, SettingsFields, SearchHistory, FilterOptions, SearchTab, GeoGroup } from './types';
import { searchByElevatorNo, searchByAddress, geocodeAddress } from './utils/api';
import { sortElevators, assignBadges, collectFilterOptions, parseRatedSpeed } from './utils/elevatorHelpers';

const ROWS_PER_PAGE = 100;

interface LastSearchParams {
  tab: SearchTab;
  elevatorNo?: string;
  sido?: string;
  sigungu?: string;
  buldNm?: string;
}
import SearchFormAdvanced from './components/SearchFormAdvanced';
import ElevatorCard from './components/ElevatorCard';
import ElevatorModal from './components/ElevatorModal';
import MapView from './components/MapView';
import SettingsMenu from './components/SettingsMenu';
import Pagination from './components/Pagination';
import FilterSidebar from './components/FilterSidebar';

const DEFAULT_SETTINGS: SettingsFields = {
  elvtrDivNm: true,
  elvtrFormNm: true,
  elvtrKindNm: true,
  elvtrModel: true,
  elvtrStts: true,
  frstInstallationDe: true,
  installationDe: true,
  lastInspctDe: true,
  lastInspctKind: true,
  inspctInstt: true,
  divGroundFloorCnt: true,
  divUndgrndFloorCnt: true,
  ratedSpeed: true,
  ratedCap: true,
  liveLoad: true,
  installationPlace: true,
  shuttleSection: true,
  mrYn: true,
  subcntrCpny: false,
  mntCpnyNm: false,
  mntCpnyTelno: false,
  partcpntNm: false,
  partcpntTelno: false,
};

function loadSettings(): SettingsFields {
  try {
    const stored = localStorage.getItem('elevatorSettings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (_) {}
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings: SettingsFields) {
  try {
    localStorage.setItem('elevatorSettings', JSON.stringify(settings));
  } catch (_) {}
}

export default function App() {
  // Search tab state
  const [searchTab, setSearchTab] = useState<SearchTab>('address');

  // Search form state
  const [elevatorNoQuery, setElevatorNoQuery] = useState('');
  const [sido, setSido] = useState('');
  const [sigungu, setSigungu] = useState('');
  const [building, setBuilding] = useState('');

  // Filter inputs (moved from search form to filter sidebar)
  const [modelKeyword, setModelKeyword] = useState('');
  const [minGroundFloor, setMinGroundFloor] = useState('');
  const [minSpeed, setMinSpeed] = useState('');

  // Search results state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageResults, setPageResults] = useState<ElevatorWithBadges[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [geoGroups, setGeoGroups] = useState<GeoGroup[]>([]);
  const [geocoding, setGeocoding] = useState(false);

  // Pagination (server-side)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.ceil(totalCount / ROWS_PER_PAGE);
  const [lastSearchParams, setLastSearchParams] = useState<LastSearchParams | null>(null);

  // Per-tab cache: save/restore results when switching tabs
  interface TabCache {
    pageResults: ElevatorWithBadges[];
    currentPage: number;
    totalCount: number;
    lastSearchParams: LastSearchParams | null;
    hasSearched: boolean;
  }
  const tabCacheRef = useRef<Record<SearchTab, TabCache | null>>({
    elevatorNo: null,
    address: null,
  });

  const handleTabChange = useCallback((newTab: SearchTab) => {
    // Save current tab state
    const currentTab = searchTab;
    tabCacheRef.current[currentTab] = {
      pageResults,
      currentPage,
      totalCount,
      lastSearchParams,
      hasSearched,
    };

    // Restore target tab state
    const cached = tabCacheRef.current[newTab];
    if (cached) {
      setPageResults(cached.pageResults);
      setCurrentPage(cached.currentPage);
      setTotalCount(cached.totalCount);
      setLastSearchParams(cached.lastSearchParams);
      setHasSearched(cached.hasSearched);
      setGeoGroups([]);
    } else {
      setPageResults([]);
      setCurrentPage(1);
      setTotalCount(0);
      setLastSearchParams(null);
      setHasSearched(false);
      setGeoGroups([]);
    }
    setError('');
    setViewMode('list');

    setSearchTab(newTab);
  }, [searchTab, pageResults, currentPage, totalCount, lastSearchParams, hasSearched]);

  // UI state
  const [selectedElevator, setSelectedElevator] = useState<ElevatorWithBadges | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [settings, setSettings] = useState<SettingsFields>(loadSettings);

  const handleSettingsChange = useCallback((next: SettingsFields) => {
    setSettings(next);
    saveSettings(next);
  }, []);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [hideEscalator, setHideEscalator] = useState(true);
  const geocodeAbortRef = useRef<AbortController | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Compute filter options from current page results
  const filterOptions: FilterOptions = useMemo(
    () => (pageResults.length > 0 ? collectFilterOptions(pageResults) : {
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
    }),
    [pageResults]
  );

  // Apply client-side filters to page results for display
  const applyFilters = useCallback((results: ElevatorWithBadges[]): ElevatorWithBadges[] => {
    let filtered = [...results];

    if (hideEscalator) {
      filtered = filtered.filter((el) => el.elvtrDivNm !== '에스컬레이터');
    }

    if (modelKeyword.trim()) {
      filtered = filtered.filter((el) =>
        el.elvtrModel?.toLowerCase().includes(modelKeyword.toLowerCase())
      );
    }
    if (minGroundFloor.trim()) {
      const minVal = parseInt(minGroundFloor, 10);
      if (!isNaN(minVal)) {
        filtered = filtered.filter((el) => {
          const floors = parseInt(el.divGroundFloorCnt, 10);
          return !isNaN(floors) && floors >= minVal;
        });
      }
    }
    if (minSpeed.trim()) {
      const minVal = parseFloat(minSpeed);
      if (!isNaN(minVal)) {
        filtered = filtered.filter((el) => {
          const speed = parseRatedSpeed(el.ratedSpeed);
          return speed !== null && speed >= minVal;
        });
      }
    }

    for (const [key, values] of Object.entries(selectedFilters)) {
      if (values.length === 0) continue;
      filtered = filtered.filter((el) => {
        const elValue = (el as any)[key];
        if (!elValue) return false;
        if (key === 'installationYear') {
          const year = elValue.slice(0, 4);
          return values.includes(year);
        }
        return values.includes(elValue);
      });
    }

    return filtered;
  }, [hideEscalator, modelKeyword, minGroundFloor, minSpeed, selectedFilters]);

  // Display results: apply client-side filters to current page
  const displayResults = useMemo(
    () => applyFilters(pageResults),
    [pageResults, applyFilters]
  );

  // Fetch a specific page from the server
  const fetchPage = useCallback(async (pageNo: number, params: LastSearchParams, signal?: AbortSignal) => {
    setLoading(true);
    setError('');

    try {
      let rawResults: ElevatorType[] = [];
      let total = 0;

      if (params.tab === 'elevatorNo') {
        const result = await searchByElevatorNo(params.elevatorNo || '', pageNo, signal);
        rawResults = result.items;
        total = result.totalCount;
      } else {
        const result = await searchByAddress({
          sido: params.sido || undefined,
          sigungu: params.sigungu || undefined,
          buldNm: params.buldNm || undefined,
          pageNo,
          signal,
        });
        rawResults = result.items;
        total = result.totalCount;
      }

      const sorted = sortElevators(rawResults);
      const withBadges = assignBadges(sorted);
      setPageResults(withBadges);
      setTotalCount(total);
    } catch (err) {
      if (signal?.aborted) return;
      setError('검색 중 오류가 발생했습니다. 다시 시도해 주세요.');
      console.error(err);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // Geocode results only when map view is active — dedup addresses, batch-render markers
  useEffect(() => {
    geocodeAbortRef.current?.abort();
    geocodeAbortRef.current = null;

    if (viewMode !== 'map' || pageResults.length === 0) {
      setGeoGroups([]);
      return;
    }

    // Dedup: group all elevators by unique address string before geocoding
    const addressMap = new Map<string, { buildingName: string; elevators: ElevatorWithBadges[] }>();
    for (const el of pageResults) {
      const addr = (el.address1 || el.address2 || '').trim();
      if (!addr) continue;
      if (!addressMap.has(addr)) {
        addressMap.set(addr, { buildingName: el.buldNm || '', elevators: [] });
      }
      addressMap.get(addr)!.elevators.push(el);
    }

    const uniqueAddresses = Array.from(addressMap.entries());
    if (uniqueAddresses.length === 0) {
      setGeoGroups([]);
      setGeocoding(false);
      return;
    }

    const controller = new AbortController();
    geocodeAbortRef.current = controller;
    const signal = controller.signal;

    setGeocoding(true);
    setGeoGroups([]);

    let firstDone = false;

    const run = async () => {
      try {
        // Fire all geocode requests in parallel (Kakao Geocoder handles its own rate limiting)
        const promises = uniqueAddresses.map(async ([addr, { buildingName, elevators }]) => {
          try {
            const coords = await geocodeAddress(addr, signal);
            if (!coords || signal.aborted) return null;
            const group: GeoGroup = {
              address: addr,
              buildingName,
              lat: coords[0],
              lng: coords[1],
              elevators,
            };
            // Immediately set the first resolved group so MapView can set initial camera
            if (!firstDone && !signal.aborted) {
              firstDone = true;
              setGeoGroups([group]);
            }
            return group;
          } catch (_) {
            return null;
          }
        });

        const settled = await Promise.allSettled(promises);
        if (signal.aborted) return;
        const groups = settled
          .filter((r): r is PromiseFulfilledResult<GeoGroup> => r.status === 'fulfilled' && r.value !== null)
          .map((r) => r.value);
        setGeoGroups(groups);
      } catch (err) {
        console.error('[geocoding] Fatal error during address resolution:', err);
      } finally {
        if (!signal.aborted) {
          setGeocoding(false);
        }
      }
    };

    run();

    return () => {
      controller.abort();
    };
  }, [viewMode, pageResults]);

  // Handle search (initial search, always page 1)
  const handleSearch = useCallback(async () => {
    geocodeAbortRef.current?.abort();
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setLoading(true);
    setError('');
    setCurrentPage(1);
    setPageResults([]);
    setGeoGroups([]);
    setHasSearched(true);
    // Reset filters on new search
    setSelectedFilters({});
    setHideEscalator(true);
    setModelKeyword('');
    setMinGroundFloor('');
    setMinSpeed('');

    // Build and validate params
    let params: LastSearchParams;

    if (searchTab === 'elevatorNo') {
      const query = elevatorNoQuery.trim();
      if (!query) {
        setError('고유번호를 입력해 주세요.');
        setLoading(false);
        return;
      }
      params = { tab: 'elevatorNo', elevatorNo: query };
    } else {
      params = {
        tab: 'address',
        sido: sido.trim() || undefined,
        sigungu: sigungu.trim() || undefined,
        buldNm: building.trim() || undefined,
      };
    }

    setLastSearchParams(params);

    // Save to history
    const historyEntry: SearchHistory = {
      type: searchTab === 'elevatorNo' ? 'view' : 'search',
      query: searchTab === 'elevatorNo'
        ? elevatorNoQuery.trim()
        : `${sido} ${sigungu}`.trim(),
      timestamp: Date.now(),
      ...(searchTab === 'elevatorNo' ? { elevatorNo: elevatorNoQuery.trim() } : {}),
      ...(modelKeyword.trim() ? { elvtrModel: modelKeyword.trim() } : {}),
      ...(
        searchTab === 'address'
          ? {
              filters: {
                ...(minGroundFloor.trim() ? { '최소 지상 운행층': minGroundFloor.trim() } : {}),
                ...(minSpeed.trim() ? { '최소 속도': minSpeed.trim() } : {}),
              },
            }
          : {}
      ),
    };
    const existing = JSON.parse(localStorage.getItem('elevatorSearchHistory') || '[]');
    localStorage.setItem('elevatorSearchHistory', JSON.stringify([...existing.slice(-19), historyEntry]));

    await fetchPage(1, params, controller.signal);
  }, [searchTab, elevatorNoQuery, sido, sigungu, building, modelKeyword, minGroundFloor, minSpeed, fetchPage]);

  // Handle page change from Pagination component
  const handlePageChange = useCallback((page: number) => {
    geocodeAbortRef.current?.abort();
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setCurrentPage(page);
    if (lastSearchParams) {
      fetchPage(page, lastSearchParams, controller.signal);
    }
  }, [lastSearchParams, fetchPage]);

  // Handle history select
  const handleHistorySelect = (history: SearchHistory) => {
    if (history.type === 'search') {
      const parts = history.query.split(/\s+/);
      if (parts[0]) setSido(parts[0]);
      if (parts.length > 1) setSigungu(parts.slice(1).join(' '));
    } else if (history.elevatorNo) {
      setSearchTab('elevatorNo');
      setElevatorNoQuery(history.elevatorNo);
    }
  };

  const handleFilterChange = (key: string, values: string[]) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [key]: values,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 8l3-3 3 3M9 16l3 3 3-3M12 5v14" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">승강기 정보</h1>
            <p className="text-xs text-gray-400">행정안전부 API</p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <Settings size={20} className="text-gray-500" />
        </button>
      </header>

      {/* Search Form */}
      <SearchFormAdvanced
        tab={searchTab}
        onTabChange={handleTabChange}
        elevatorNoQuery={elevatorNoQuery}
        onElevatorNoQueryChange={setElevatorNoQuery}
        sido={sido}
        onSidoChange={setSido}
        sigungu={sigungu}
        onSigunguChange={setSigungu}
        building={building}
        onBuildingChange={setBuilding}
        onSearch={handleSearch}
        loading={loading}
        onFilterClick={() => setShowFilter(true)}
      />

      {/* Results Header */}
      {pageResults.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100 sticky top-12 z-10">
          <span className="text-xs text-gray-500 font-medium">
            전체 {totalCount}건 | 페이지 {totalCount > 0 ? `${(currentPage - 1) * ROWS_PER_PAGE + 1}-${Math.min(currentPage * ROWS_PER_PAGE, totalCount)}` : '0'}
            {geocoding && <span className="ml-2 text-blue-500">지도 생성 중...</span>}
          </span>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              <List size={12} />
              목록
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              <MapIcon size={12} />
              지도
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-3 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-1.5" />
                <div className="h-2.5 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty (no server results at all) */}
        {!loading && hasSearched && pageResults.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">검색 결과가 없습니다.</p>
          </div>
        )}

        {/* Filter yields 0 on this page but results exist on other pages */}
        {!loading && hasSearched && pageResults.length > 0 && displayResults.length === 0 && viewMode === 'list' && (
          <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
            <p className="text-sm text-gray-400">현재 페이지에 필터 조건에 맞는 승강기가 없습니다</p>
            <p className="text-xs text-gray-300 mt-1">다른 페이지를 확인해 보세요</p>
          </div>
        )}

        {/* Initial State */}
        {!loading && !hasSearched && (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#3b82f6" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 8l3-3 3 3M9 16l3 3 3-3M12 5v14" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-800 mb-1">승강기 정보 검색</h2>
            <p className="text-sm text-gray-500">고유번호 또는 주소로 승강기를 검색하세요.</p>
          </div>
        )}

        {/* Pagination Top */}
        {pageResults.length > 0 && totalPages > 1 && viewMode === 'list' && (
          <div className="px-4 pt-3">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* Map View */}
        {viewMode === 'map' && hasSearched && (
          <div className="p-4">
            <MapView
              geoGroups={geoGroups}
              geocoding={geocoding}
              totalElevators={displayResults.length}
              onMarkerClick={(el) => setSelectedElevator(el)}
            />
          </div>
        )}

        {/* List View */}
        {!loading && viewMode === 'list' && displayResults.length > 0 && (
          <div className="p-4 space-y-2">
            {displayResults.map((el) => (
              <ElevatorCard
                key={`${el.elevatorNo}-${el.installationPlace}`}
                elevator={el}
                settings={settings}
                onClick={() => {
                  setSelectedElevator(el);
                  const historyEntry: SearchHistory = {
                    type: 'view',
                    query: `${el.buldNm} - ${el.elevatorNo}`,
                    timestamp: Date.now(),
                    elevatorNo: el.elevatorNo,
                    ...(el.elvtrModel ? { elvtrModel: el.elvtrModel } : {}),
                  };
                  const existing = JSON.parse(localStorage.getItem('elevatorSearchHistory') || '[]');
                  localStorage.setItem('elevatorSearchHistory', JSON.stringify([...existing.slice(-19), historyEntry]));
                }}
              />
            ))}
          </div>
        )}

        {/* Pagination Bottom */}
        {pageResults.length > 0 && totalPages > 1 && viewMode === 'list' && (
          <div className="px-4 pb-3">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </main>

      {/* Modal */}
      {selectedElevator && (
        <ElevatorModal
          elevator={selectedElevator}
          settings={settings}
          onClose={() => setSelectedElevator(null)}
        />
      )}

      {/* Settings */}
      {showSettings && (
        <SettingsMenu
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
          onHistorySelect={handleHistorySelect}
        />
      )}

      {/* Filter Sidebar */}
      {showFilter && (
        <FilterSidebar
          filters={filterOptions}
          selected={selectedFilters}
          onFilterChange={handleFilterChange}
          onClose={() => setShowFilter(false)}
          modelKeyword={modelKeyword}
          onModelKeywordChange={setModelKeyword}
          minGroundFloor={minGroundFloor}
          onMinGroundFloorChange={setMinGroundFloor}
          minSpeed={minSpeed}
          onMinSpeedChange={setMinSpeed}
          hideEscalator={hideEscalator}
          onHideEscalatorChange={setHideEscalator}
        />
      )}
    </div>
  );
}
