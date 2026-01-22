import { useState, useEffect, useCallback, useRef } from 'react';

interface TouchControls {
  isTouching: boolean;
  touchPosition: { x: number; y: number } | null;
  swipeDirection: 'left' | 'right' | 'up' | 'down' | null;
  pinchScale: number;
  tapCount: number;
  longPress: boolean;
}

export const useTouchControls = (
  elementRef: React.RefObject<HTMLElement>,
  options = {
    enableSwipe: true,
    enablePinch: true,
    enableLongPress: true,
    swipeThreshold: 50,
    longPressDelay: 500
  }
) => {
  const [controls, setControls] = useState<TouchControls>({
    isTouching: false,
    touchPosition: null,
    swipeDirection: null,
    pinchScale: 1,
    tapCount: 0,
    longPress: false
  });

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTouchCountRef = useRef<number>(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const position = { x: touch.clientX, y: touch.clientY };
    
    setControls(prev => ({
      ...prev,
      isTouching: true,
      touchPosition: position,
      swipeDirection: null
    }));

    touchStartRef.current = {
      x: position.x,
      y: position.y,
      time: Date.now()
    };

    // ダブルタップ判定
    const now = Date.now();
    const tapLength = now - lastTapRef.current;
    if (tapLength < 300 && tapLength > 0) {
      setControls(prev => ({ ...prev, tapCount: prev.tapCount + 1 }));
    }
    lastTapRef.current = now;

    // 長押し判定
    if (options.enableLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        setControls(prev => ({ ...prev, longPress: true }));
      }, options.longPressDelay);
    }

    // ピンチ開始
    if (options.enablePinch && e.touches.length === 2) {
      lastTouchCountRef.current = 2;
    }
  }, [options]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const currentPosition = { x: touch.clientX, y: touch.clientY };
    
    setControls(prev => ({ ...prev, touchPosition: currentPosition }));

    // 長押しキャンセル
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // スワイプ判定
    if (options.enableSwipe && e.touches.length === 1) {
      const deltaX = currentPosition.x - touchStartRef.current.x;
      const deltaY = currentPosition.y - touchStartRef.current.y;

      if (Math.abs(deltaX) > options.swipeThreshold || Math.abs(deltaY) > options.swipeThreshold) {
        let direction: 'left' | 'right' | 'up' | 'down' | null = null;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        setControls(prev => ({ ...prev, swipeDirection: direction }));
      }
    }

    // ピンチズーム
    if (options.enablePinch && e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      if (lastTouchCountRef.current === 2) {
        // 初期距離を設定
        const initialDistance = Math.sqrt(
          Math.pow(touch2.clientX - touchStartRef.current.x, 2) +
          Math.pow(touch2.clientY - touchStartRef.current.y, 2)
        );
        const scale = currentDistance / initialDistance;
        setControls(prev => ({ ...prev, pinchScale: scale }));
      }
    }
  }, [options]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    
    setControls(prev => ({
      ...prev,
      isTouching: false,
      longPress: false
    }));

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    touchStartRef.current = null;
    lastTouchCountRef.current = e.touches.length;
  }, []);

  const handleTouchCancel = useCallback((e: TouchEvent) => {
    e.preventDefault();
    setControls(prev => ({ ...prev, isTouching: false, longPress: false }));
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

  return controls;
};
