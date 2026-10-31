import React, { useEffect, useRef } from 'react';
import { getNextSegmentedOption, getTrappedFocusIndex } from './calculators';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Provides full WAI-ARIA Dialog (Modal) keyboard navigation:
 * - Closes on Escape key
 * - Traps Tab / Shift+Tab focus within the modal container
 * - Moves focus into the modal on open and restores focus to the trigger element on close
 */
export function useModalKeyboard(isOpen: boolean, onClose: () => void) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    // Focus first interactive element inside modal (prefer primary input/control or close button)
    const timer = window.setTimeout(() => {
      const container = modalRef.current;
      if (!container) return;
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.classList.contains('sr-only') && el.offsetParent !== null);

      const initialTarget =
        container.querySelector<HTMLElement>('[data-autofocus="true"]') ||
        focusable[0] ||
        container;
      initialTarget.focus();
    }, 10);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab') {
        const container = modalRef.current;
        if (!container) return;
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => !el.classList.contains('sr-only') && el.offsetParent !== null);

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const activeEl = document.activeElement as HTMLElement | null;
        const activeIndex = activeEl ? focusable.indexOf(activeEl) : -1;
        const wrappedIndex = getTrappedFocusIndex(focusable.length, activeIndex, e.shiftKey);

        if (wrappedIndex !== null) {
          e.preventDefault();
          focusable[wrappedIndex]?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  return modalRef;
}

/**
 * Keyboard handler for custom segmented button groups, radio groups, and tablists.
 * Supports ArrowRight, ArrowDown, ArrowLeft, ArrowUp, Home, and End keys,
 * updating the state value and moving DOM focus to the newly selected button.
 */
export function handleSegmentedKeyDown<T>(
  e: React.KeyboardEvent<HTMLElement>,
  options: readonly T[],
  currentValue: T,
  onSelect: (next: T) => void
) {
  const result = getNextSegmentedOption(options, currentValue, e.key);
  if (!result) return;

  e.preventDefault();
  onSelect(result.nextValue);

  const groupEl = e.currentTarget;
  const buttons = Array.from(
    groupEl.querySelectorAll<HTMLElement>('button:not([disabled]), [role="tab"], [role="radio"]')
  );
  buttons[result.nextIndex]?.focus();
}
