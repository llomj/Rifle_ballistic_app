import { useEffect, useRef } from 'react';

const SWIPE_THRESHOLD_PX = 40;
const MAX_VERTICAL_PX = 100;
const WHEEL_SWIPE_THRESHOLD = 50;

/** Listens for swipe-left (touch, mouse drag, trackpad wheel). Calls onSwipe when detected. */
export function useSwipeLeft(onSwipe: (() => void) | undefined): void {
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const wheelAccum = useRef(0);
  const wheelCooldown = useRef(0);

  useEffect(() => {
    if (!onSwipe) return;
    const fire = () => onSwipeRef.current?.();
    const checkSwipeLeft = (startX: number, startY: number, endX: number, endY: number) => {
      const dx = endX - startX;
      const dy = Math.abs(endY - startY);
      if (dx <= -SWIPE_THRESHOLD_PX && dy <= MAX_VERTICAL_PX) fire();
    };
    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (start && e.changedTouches.length > 0) {
        checkSwipeLeft(start.x, start.y, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    };
    const handleTouchCancel = () => {
      touchStart.current = null;
    };
    const handleMouseDown = (e: MouseEvent) => {
      touchStart.current = e.button === 0 ? { x: e.clientX, y: e.clientY } : null;
    };
    const handleMouseUp = (e: MouseEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (start && e.button === 0) checkSwipeLeft(start.x, start.y, e.clientX, e.clientY);
    };
    const handleWheel = (e: WheelEvent) => {
      if (wheelCooldown.current > 0) return;
      const dx = e.deltaX;
      if (Math.abs(dx) < 5) return;
      if (Math.abs(dx) < Math.abs(e.deltaY)) return;
      wheelAccum.current += dx;
      if (Math.abs(wheelAccum.current) >= WHEEL_SWIPE_THRESHOLD) {
        // Swipe left: negative accumulated deltaX
        if (wheelAccum.current <= -WHEEL_SWIPE_THRESHOLD) {
          wheelAccum.current = 0;
          wheelCooldown.current = 400;
          fire();
        } else {
          wheelAccum.current = 0;
        }
      } else if ((wheelAccum.current < 0 && dx > 0) || (wheelAccum.current > 0 && dx < 0)) {
        wheelAccum.current = 0;
      }
    };
    const cooldownInterval = window.setInterval(() => {
      if (wheelCooldown.current > 0) wheelCooldown.current = Math.max(0, wheelCooldown.current - 50);
    }, 50);

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
  }, [onSwipe]);
}
