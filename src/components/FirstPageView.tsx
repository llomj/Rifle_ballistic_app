import React, { useState, useRef, useEffect } from 'react';
import { useSound } from '../contexts/SoundContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBallisticSettings } from '../contexts/BallisticSettingsContext';
import { useTrajectoryTables } from '../hooks/useTrajectoryTables';
import { CIRCLE_SIZE_PX } from '../constants/ballisticUI';

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
  const { measurement } = useBallisticSettings();
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

  const handleOpenHub = () => {
    if (swipeJustFired.current) {
      swipeJustFired.current = false;
      return;
    }
    playTapSound();
    onOpenHub();
  };

  const TICK_COUNT = 32;
  const radius = CIRCLE_SIZE_PX / 2;
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const deg = (i / TICK_COUNT) * 360;
    const isNESW = i % 8 === 0; // N, E, S, W only
    const isIntercardinal = i % 8 === 4; // NE, SE, SW, NW
    const tickLen = isNESW ? 18 : isIntercardinal ? 12 : 6; // lensatic: cardinal longest
    return { deg, tickLen };
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-200px)] px-4 font-mono text-xs touch-pan-y">
      {/* Lensatic-style compass with cardinal ticks and ^ north */}
      <button
        type="button"
        onClick={handleOpenHub}
        className="relative rounded-full border-2 border-amber-400/50 bg-amber-500/10 flex flex-col items-center justify-center shadow-lg shadow-amber-500/10 gap-1.5 hover:bg-amber-500/20 hover:border-amber-400/70 active:scale-[0.98] transition-all touch-manipulation"
        style={{ width: CIRCLE_SIZE_PX, height: CIRCLE_SIZE_PX }}
        aria-label={t('firstPage.openHub')}
      >
        {/* North indicator ^ at top (lensatic style) */}
        <span
          className="absolute left-1/2 top-2 z-20 font-mono font-bold text-amber-400 text-xl -translate-x-1/2 drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]"
          aria-hidden
        >
          ^
        </span>
        {/* Compass tick marks around rim (cardinal bigger, point inward) */}
        {ticks.map(({ deg, tickLen }) => (
          <div
            key={deg}
            className="absolute left-1/2 top-1/2 w-px origin-bottom"
            style={{
              height: tickLen,
              backgroundColor: 'rgba(251, 191, 36, 0.5)',
              transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-${radius}px)`,
            }}
          />
        ))}
        <span className="font-mono font-bold text-amber-300 tabular-nums text-4xl leading-none relative z-10">
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
          className="flex items-baseline gap-0.5 relative z-10"
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
        <span className="text-[10px] text-slate-500 uppercase tracking-wider pt-1 relative z-10">{t('firstPage.tapToOpen')}</span>
      </button>
    </div>
  );
};
