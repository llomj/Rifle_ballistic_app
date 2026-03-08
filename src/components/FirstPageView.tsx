import React, { useState, useRef, useEffect } from 'react';
import { useSound } from '../contexts/SoundContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBallisticSettings } from '../contexts/BallisticSettingsContext';
import { useTrajectoryTables } from '../hooks/useTrajectoryTables';
import { CIRCLE_SIZE_PX, CIRCLE_SLOT_HEIGHT } from '../constants/ballisticUI';

interface FirstPageViewProps {
  /** Navigate to main Ballistic Hub */
  onOpenHub: () => void;
  /** Swipe right on first page opens calculate section (Distance/Height). */
  onOpenCalculate?: () => void;
}

const SWIPE_THRESHOLD_PX = 80;
const MAX_VERTICAL_PX = 100;
const WHEEL_SWIPE_THRESHOLD = 50; // Accumulated |deltaX| for trackpad two-finger swipe

/** First Page: only the clicks circle + settings. User taps circle to open main hub. Swipe right opens calculate section. */
export const FirstPageView: React.FC<FirstPageViewProps> = ({ onOpenHub, onOpenCalculate }) => {
  const { playTapSound } = useSound();
  const { t } = useLanguage();
  const { measurement, compassMode } = useBallisticSettings();
  const [heading, setHeading] = useState<number | null>(null);
  const { getTurretForExactDistance } = useTrajectoryTables();
  const [clicksMeters, setClicksMeters] = useState('');
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onOpenCalculateRef = useRef(onOpenCalculate);
  onOpenCalculateRef.current = onOpenCalculate;
  const swipeJustFired = useRef(false);
  const wheelAccum = useRef(0);
  const wheelCooldown = useRef(0);

  const fireSwipeRight = () => {
    swipeJustFired.current = true;
    playTapSound();
    onOpenCalculateRef.current?.();
  };

  useEffect(() => {
    if (!onOpenCalculate) return;
    const checkSwipeRight = (startX: number, startY: number, endX: number, endY: number) => {
      const dx = endX - startX;
      const dy = Math.abs(endY - startY);
      if (dx >= SWIPE_THRESHOLD_PX && dy <= MAX_VERTICAL_PX) fireSwipeRight();
    };
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else {
        touchStart.current = null;
      }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (start == null || e.changedTouches.length === 0) return;
      checkSwipeRight(start.x, start.y, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    };
    const handleTouchCancel = () => {
      touchStart.current = null;
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        touchStart.current = { x: e.clientX, y: e.clientY };
      } else {
        touchStart.current = null;
      }
    };
    const handleMouseUp = (e: MouseEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (start != null && e.button === 0) {
        checkSwipeRight(start.x, start.y, e.clientX, e.clientY);
      }
    };
    const handleWheel = (e: WheelEvent) => {
      if (wheelCooldown.current > 0) return;
      const dx = e.deltaX;
      if (Math.abs(dx) < 5) return; // Ignore tiny jitter
      if (Math.abs(dx) < Math.abs(e.deltaY)) return; // Prefer horizontal over vertical
      wheelAccum.current += dx;
      // Swipe right: positive deltaX (most browsers) or try negative (natural scroll)
      if (Math.abs(wheelAccum.current) >= WHEEL_SWIPE_THRESHOLD) {
        wheelAccum.current = 0;
        wheelCooldown.current = 400;
        fireSwipeRight();
      } else if ((wheelAccum.current > 0 && dx < 0) || (wheelAccum.current < 0 && dx > 0)) {
        wheelAccum.current = 0; // Reset on direction change
      }
    };
    const tickCooldown = () => {
      if (wheelCooldown.current > 0) {
        wheelCooldown.current = Math.max(0, wheelCooldown.current - 50);
      }
    };
    const cooldownInterval = window.setInterval(tickCooldown, 50);

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      clearInterval(cooldownInterval);
    };
  }, [onOpenCalculate]);

  const smoothedHeading = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (!compassMode) {
      setHeading(null);
      smoothedHeading.current = null;
      return;
    }
    const SMOOTH = 0.06; // Lower = smoother, less flicker
    const DEAD_ZONE = 1.5; // Ignore tiny jitter (degrees)
    const handler = (e: DeviceOrientationEvent) => {
      const a = e.alpha;
      if (a == null || Number.isNaN(a)) return;
      const raw = (a + 360) % 360;
      const prev = smoothedHeading.current;
      let diff = prev == null ? 0 : raw - prev;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      if (Math.abs(diff) < DEAD_ZONE && prev != null) return; // Skip tiny changes
      const next =
        prev == null ? raw : (prev + diff * SMOOTH + 360) % 360;
      smoothedHeading.current = next;
      if (rafId.current == null) {
        rafId.current = requestAnimationFrame(() => {
          rafId.current = null;
          setHeading(smoothedHeading.current);
        });
      }
    };
    window.addEventListener('deviceorientation', handler);
    return () => {
      window.removeEventListener('deviceorientation', handler);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, [compassMode]);

  const handleOpenHub = () => {
    if (swipeJustFired.current) {
      swipeJustFired.current = false;
      return;
    }
    playTapSound();
    onOpenHub();
  };

  const radius = CIRCLE_SIZE_PX / 2;

  return (
    <div className="flex flex-col items-center min-h-[calc(100dvh-200px)] px-4 font-mono text-xs touch-pan-y">
      <div
        className="flex-shrink-0 flex items-center justify-center w-full"
        style={{ height: CIRCLE_SLOT_HEIGHT }}
      >
      {/* Lensatic-style compass with cardinal ticks and ^ north */}
      <button
        type="button"
        onClick={handleOpenHub}
        className="relative rounded-full border-2 border-amber-400/50 bg-amber-500/10 flex flex-col items-center justify-center shadow-lg shadow-amber-500/10 gap-1.5 hover:bg-amber-500/20 hover:border-amber-400/70 active:scale-[0.98] transition-all touch-manipulation"
        style={{ width: CIRCLE_SIZE_PX, height: CIRCLE_SIZE_PX }}
        aria-label={t('firstPage.openHub')}
      >
        {/* Fixed center: input+m at true center, clicks above, tap to open below */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
          <span className="font-mono font-bold text-amber-300 tabular-nums text-4xl leading-none -mb-1">
            {clicksMeters.trim() !== ''
              ? (() => {
                  const raw = parseFloat(String(clicksMeters).replace(',', '.')) || 0;
                  const distM = measurement === 'imperial' ? raw * 0.9144 : raw;
                  const exact = distM > 0 ? getTurretForExactDistance(distM) : null;
                  const n = exact?.line.match(/\^(\d+)\s*clicks?/i)?.[1];
                  return n != null ? `^${n}` : '^—';
                })()
              : '^—'}
          </span>
          <div
            className="flex items-baseline gap-0.5 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              inputMode="decimal"
              value={clicksMeters}
              onChange={(e) => setClicksMeters(e.target.value)}
              placeholder={measurement === 'imperial' ? 'yd' : 'm'}
              className="w-28 bg-transparent border-none text-center font-mono text-4xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-0"
            />
            <span className="font-mono text-3xl text-slate-400">{measurement === 'imperial' ? 'y' : 'm'}</span>
          </div>
          {compassMode && heading != null && (
            <span className="text-sm text-amber-400/90 font-mono tabular-nums mt-2">
              {Math.round(heading)}° · {Math.round(heading * 60)} MOA
            </span>
          )}
          <span className="absolute left-1/2 -translate-x-1/2 text-[10px] text-slate-500 uppercase tracking-wider" style={{ bottom: 44 }}>{t('firstPage.tapToOpen')}</span>
        </div>

        {/* Fixed bezel: serrations, sighting notch (does not rotate) */}
        {Array.from({ length: 120 }, (_, i) => {
          const d = (i / 120) * 360;
          const isCardinal = i % 30 === 0;
          return (
            <div
              key={`serration-${d}`}
              className="absolute left-1/2 top-1/2 w-px origin-top z-[5]"
              style={{
                height: isCardinal ? 8 : 4,
                backgroundColor: 'rgba(251, 191, 36, 0.35)',
                transform: `translate(-50%, -50%) rotate(${d}deg) translateY(-${radius}px)`,
              }}
            />
          );
        })}
        <div
          className="absolute left-1/2 top-0 w-0.5 h-4 -translate-x-1/2 rounded-b z-[5]"
          style={{ backgroundColor: 'rgba(251, 191, 36, 0.7)' }}
          aria-hidden
        />

        {/* Rotating ring + north arrow (compass dial) — rotates so ^ points north */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            transform: compassMode && heading != null ? `rotate(${-heading}deg)` : undefined,
            transition: compassMode ? 'transform 0.18s ease-out' : 'none',
          }}
        >
          {/* North arrow ^ */}
          <span
            className="absolute left-1/2 top-2 font-mono font-bold text-amber-400 text-xl -translate-x-1/2 drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]"
            aria-hidden
          >
            ^
          </span>
          {/* N only (top, bigger) */}
          <span
            className="absolute left-1/2 top-0 font-mono font-bold text-amber-400/95 text-base -translate-x-1/2 mt-3"
            style={{ transform: 'translateX(-50%)' }}
            aria-hidden
          >
            N
          </span>
        </div>
      </button>
      </div>
    </div>
  );
};
