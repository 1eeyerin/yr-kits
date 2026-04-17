"use client";

import { useEffect } from "react";

let lockCount = 0;
let originalOverflow: string | null = null;
let originalTouchAction: string | null = null;

function lockBodyScroll() {
  if (typeof document === "undefined") {
    return;
  }

  if (lockCount === 0) {
    originalOverflow = document.body.style.overflow;
    originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
  }

  lockCount += 1;
}

function unlockBodyScroll() {
  if (typeof document === "undefined") {
    return;
  }

  lockCount = Math.max(0, lockCount - 1);

  if (lockCount === 0) {
    document.body.style.overflow = originalOverflow ?? "";
    document.body.style.touchAction = originalTouchAction ?? "";
    originalOverflow = null;
    originalTouchAction = null;
  }
}

/**
 * React 전용 body scroll lock 훅.
 * locked=true 동안 body 스크롤을 잠그고, 언마운트/해제 시 자동 복구합니다.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) {
      return;
    }

    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [locked]);
}
