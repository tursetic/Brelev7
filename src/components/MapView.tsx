import React, { useEffect, useRef } from 'react';
import { GeoGroup, ElevatorWithBadges } from '../types';
import { formatRatedSpeed, getStatusHexColor } from '../utils/elevatorHelpers';
import { ensureKakaoReady } from '../utils/api';

// Kakao Maps global type shim
declare global {
  interface Window {
    kakao: any;
  }
}

interface Props {
  geoGroups: GeoGroup[];
  geocoding: boolean;
  totalElevators: number;
  onMarkerClick: (elevator: ElevatorWithBadges) => void;
}

// Build a custom overlay DOM node for a group of elevators
function buildOverlayContent(
  group: GeoGroup,
  onElevatorClick: (el: ElevatorWithBadges) => void,
  onClose: () => void
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = [
    'position:relative',
    'background:#fff',
    'border-radius:12px',
    'box-shadow:0 8px 24px rgba(0,0,0,0.13)',
    'border:1px solid #f0f0f0',
    'min-width:220px',
    'max-width:280px',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
    'overflow:hidden',
  ].join(';');

  // Header
  const header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding:10px 12px 8px';
  header.innerHTML = `
    <div style="flex:1;min-width:0;">
      <div style="font-size:13px;font-weight:700;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${group.buildingName || '건물명 없음'}</div>
      <div style="font-size:11px;color:#9ca3af;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${group.address}</div>
      <div style="font-size:10px;color:#6b7280;margin-top:2px;">${group.elevators.length}대 승강기</div>
    </div>
  `;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = [
    'flex-shrink:0',
    'width:20px',
    'height:20px',
    'border:none',
    'background:#f3f4f6',
    'border-radius:6px',
    'cursor:pointer',
    'font-size:11px',
    'color:#6b7280',
    'line-height:1',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'padding:0',
  ].join(';');
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onClose();
  });
  header.appendChild(closeBtn);
  wrap.appendChild(header);

  // Divider
  const divider = document.createElement('div');
  divider.style.cssText = 'height:1px;background:#f3f4f6;margin:0 12px';
  wrap.appendChild(divider);

  // Elevator list
  const list = document.createElement('div');
  list.style.cssText = 'max-height:200px;overflow-y:auto;padding:6px 8px';
  list.className = 'ev-popup-list';

  for (const el of group.elevators) {
    const btn = document.createElement('button');
    btn.style.cssText = [
      'display:flex',
      'align-items:center',
      'gap:6px',
      'padding:5px 6px',
      'border-radius:6px',
      'cursor:pointer',
      'text-align:left',
      'width:100%',
      'border:none',
      'background:transparent',
    ].join(';');

    const sc = getStatusHexColor(el.elvtrStts);
    const label = el.elvtrAsignNo
      ? `${el.elvtrAsignNo}호기${el.installationPlace ? ' ' + el.installationPlace : ''}`
      : el.elevatorNo;

    btn.innerHTML = `
      <span style="font-size:11px;font-weight:700;color:#2563eb;white-space:nowrap;">${label}</span>
      <span style="font-size:10px;font-weight:600;color:${sc};background:${sc}18;padding:1px 5px;border-radius:4px;white-space:nowrap;">${el.elvtrStts || '-'}</span>
      <span style="font-size:10px;color:#6b7280;white-space:nowrap;">${formatRatedSpeed(el.ratedSpeed)}</span>
    `;
    btn.addEventListener('mouseover', () => { btn.style.background = '#f0f5ff'; });
    btn.addEventListener('mouseout', () => { btn.style.background = 'transparent'; });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onElevatorClick(el);
    });
    list.appendChild(btn);
  }
  wrap.appendChild(list);

  // Tail arrow pointing down
  const tail = document.createElement('div');
  tail.style.cssText = [
    'width:0',
    'height:0',
    'border-left:8px solid transparent',
    'border-right:8px solid transparent',
    'border-top:10px solid #fff',
    'position:absolute',
    'bottom:-10px',
    'left:50%',
    'transform:translateX(-50%)',
    'filter:drop-shadow(0 2px 2px rgba(0,0,0,0.08))',
  ].join(';');
  wrap.appendChild(tail);

  return wrap;
}

// Create custom SVG marker icon HTML
function markerIconHtml(count: number): string {
  if (count === 1) {
    return `<div style="position:relative;width:28px;height:36px;cursor:pointer;">
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.268 0 0 6.268 0 14c0 9.625 14 22 14 22s14-12.375 14-22C28 6.268 21.732 0 14 0z" fill="#2563eb"/>
        <circle cx="14" cy="13" r="6" fill="white"/>
      </svg>
    </div>`;
  }
  return `<div style="position:relative;width:34px;height:44px;cursor:pointer;">
    <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 0C7.611 0 0 7.611 0 17c0 12.25 17 27 17 27s17-14.75 17-27C34 7.611 26.389 0 17 0z" fill="#1d4ed8"/>
      <circle cx="17" cy="16" r="10" fill="white"/>
      <text x="17" y="20" text-anchor="middle" font-size="10" font-weight="700" fill="#1d4ed8">${count}</text>
    </svg>
  </div>`;
}

export default function MapView({ geoGroups, geocoding, totalElevators, onMarkerClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const activeOverlayRef = useRef<any>(null);
  const hasInitialViewRef = useRef(false);
  const prevGroupKeyRef = useRef('');
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;

  // Initialize Kakao Map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let destroyed = false;

    ensureKakaoReady().then(() => {
      if (destroyed || !containerRef.current || mapRef.current) return;
      const kakao = window.kakao;
      const container = containerRef.current;

      const options = {
        center: new kakao.maps.LatLng(36.5, 127.8),
        level: 10,
      };
      mapRef.current = new kakao.maps.Map(container, options);
    });

    return () => {
      destroyed = true;
      // Clean up markers and overlays
      for (const m of markersRef.current) {
        try { m.setMap(null); } catch (_) {}
      }
      markersRef.current = [];
      if (activeOverlayRef.current) {
        try { activeOverlayRef.current.setMap(null); } catch (_) {}
        activeOverlayRef.current = null;
      }
      mapRef.current = null;
      hasInitialViewRef.current = false;
      prevGroupKeyRef.current = '';
    };
  }, []);

  // Reset when geoGroups cleared (new search)
  useEffect(() => {
    if (geoGroups.length === 0) {
      hasInitialViewRef.current = false;
      prevGroupKeyRef.current = '';
    }
  }, [geoGroups.length]);

  // Render markers in batch when geoGroups change
  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;
    if (geoGroups.length === 0) return;

    const groupKey = geoGroups
      .map((g) => `${g.lat.toFixed(5)},${g.lng.toFixed(5)}:${g.elevators.length}`)
      .join('|');
    if (groupKey === prevGroupKeyRef.current) return;
    prevGroupKeyRef.current = groupKey;

    const kakao = window.kakao;

    // Remove old markers
    for (const m of markersRef.current) {
      try { m.setMap(null); } catch (_) {}
    }
    markersRef.current = [];

    // Close any open overlay
    if (activeOverlayRef.current) {
      try { activeOverlayRef.current.setMap(null); } catch (_) {}
      activeOverlayRef.current = null;
    }

    // Batch-add all markers
    for (const group of geoGroups) {
      if (group.lat == null || group.lng == null || isNaN(group.lat) || isNaN(group.lng)) continue;
      if (!group.elevators || group.elevators.length === 0) continue;

      try {
        const latlng = new kakao.maps.LatLng(group.lat, group.lng);

        // Custom marker image via MarkerImage
        const imageDiv = document.createElement('div');
        imageDiv.innerHTML = markerIconHtml(group.elevators.length);
        const svgEl = imageDiv.firstChild as HTMLElement;
        const w = group.elevators.length === 1 ? 28 : 34;
        const h = group.elevators.length === 1 ? 36 : 44;

        const markerImage = new kakao.maps.MarkerImage(
          `data:image/svg+xml;base64,${btoa(
            `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">` +
            (group.elevators.length === 1
              ? `<path d="M14 0C6.268 0 0 6.268 0 14c0 9.625 14 22 14 22s14-12.375 14-22C28 6.268 21.732 0 14 0z" fill="#2563eb"/><circle cx="14" cy="13" r="6" fill="white"/>`
              : `<path d="M17 0C7.611 0 0 7.611 0 17c0 12.25 17 27 17 27s17-14.75 17-27C34 7.611 26.389 0 17 0z" fill="#1d4ed8"/><circle cx="17" cy="16" r="10" fill="white"/><text x="17" y="20" text-anchor="middle" font-size="10" font-weight="700" fill="#1d4ed8">${group.elevators.length}</text>`) +
            `</svg>`
          )}`,
          new kakao.maps.Size(w, h),
          { offset: new kakao.maps.Point(w / 2, h) }
        );

        const marker = new kakao.maps.Marker({
          position: latlng,
          image: markerImage,
        });
        marker.setMap(mapRef.current);
        markersRef.current.push(marker);

        // Build CustomOverlay for this group (lazy, created on click)
        kakao.maps.event.addListener(marker, 'click', () => {
          // Close any previously open overlay
          if (activeOverlayRef.current) {
            try { activeOverlayRef.current.setMap(null); } catch (_) {}
            activeOverlayRef.current = null;
          }

          const overlayContent = buildOverlayContent(
            group,
            (el) => {
              // Close overlay then open modal
              if (activeOverlayRef.current) {
                try { activeOverlayRef.current.setMap(null); } catch (_) {}
                activeOverlayRef.current = null;
              }
              onMarkerClickRef.current(el);
            },
            () => {
              if (activeOverlayRef.current) {
                try { activeOverlayRef.current.setMap(null); } catch (_) {}
                activeOverlayRef.current = null;
              }
            }
          );

          const overlay = new kakao.maps.CustomOverlay({
            position: latlng,
            content: overlayContent,
            xAnchor: 0.5,
            yAnchor: 1.22,
            zIndex: 10,
          });
          overlay.setMap(mapRef.current);
          activeOverlayRef.current = overlay;
        });

        // Clicking the map background closes any open overlay
        kakao.maps.event.addListener(mapRef.current, 'click', () => {
          if (activeOverlayRef.current) {
            try { activeOverlayRef.current.setMap(null); } catch (_) {}
            activeOverlayRef.current = null;
          }
        });

        svgEl; // prevent unused var lint
      } catch (_) {
        // Individual marker failure must not crash the rest
      }
    }

    // One-time initial camera: zoom to first group only
    if (!hasInitialViewRef.current && geoGroups.length > 0) {
      const first = geoGroups[0];
      if (first && !isNaN(first.lat) && !isNaN(first.lng)) {
        try {
          mapRef.current.setCenter(new kakao.maps.LatLng(first.lat, first.lng));
          mapRef.current.setLevel(3);
        } catch (_) {}
        hasInitialViewRef.current = true;
      }
    }
  }, [geoGroups]);

  return (
    <div
      className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-sm border border-gray-200 relative"
      style={{ height: 300 }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Loading overlay */}
      {geocoding && geoGroups.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-10 h-10">
              <svg className="w-full h-full animate-spin" viewBox="0 0 50 50" fill="none">
                <circle cx="25" cy="25" r="20" stroke="rgba(37, 99, 235, 0.2)" strokeWidth="3" />
                <circle cx="25" cy="25" r="20" stroke="#2563eb" strokeWidth="3" strokeDasharray="31.4 125.6" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-gray-600">주소 변환 중...</p>
          </div>
        </div>
      )}

      {/* Location/count badge */}
      {geoGroups.length > 0 && (
        <div className="absolute top-2 left-2 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm text-xs font-medium text-gray-600 pointer-events-none">
          {geoGroups.length}개 위치 / {totalElevators}대 승강기
        </div>
      )}
    </div>
  );
}
