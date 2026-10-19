import { type KeyboardEvent, type PointerEvent, useRef, useState } from 'react';

export interface SplitResizeOptions {
  /** Initial size of the first pane, in percent of the container. */
  defaultSize: number;
  minSize: number;
  maxSize: number;
  /** Percent moved per arrow key press. Defaults to 1. */
  keyboardStep?: number;
}

export interface SplitResize {
  /** Size of the first pane, in percent of the container. */
  size: number;
  isResizing: boolean;
  /** Attach to the element whose width the percentages refer to. */
  containerRef: (element: HTMLElement | null) => void;
  /** Spread onto the separator between the two panes. */
  separatorProps: {
    role: 'separator';
    tabIndex: 0;
    'aria-orientation': 'vertical';
    'aria-valuenow': number;
    'aria-valuemin': number;
    'aria-valuemax': number;
    onPointerDown: (event: PointerEvent<HTMLElement>) => void;
    onPointerMove: (event: PointerEvent<HTMLElement>) => void;
    onPointerUp: (event: PointerEvent<HTMLElement>) => void;
    onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  };
}

const round = (value: number) => Math.round(value * 10) / 10;

/**
 * Resizes the first of two side-by-side panes with a separator, by pointer
 * (mouse, touch or pen) or keyboard. Arrow keys step by `keyboardStep`, and
 * Home and End jump to the limits.
 */
export function useSplitResize({
  defaultSize,
  minSize,
  maxSize,
  keyboardStep = 1,
}: SplitResizeOptions): SplitResize {
  const [size, setSize] = useState(defaultSize);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  const clamp = (value: number) =>
    round(Math.min(maxSize, Math.max(minSize, value)));

  const resizeTo = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();

    if (!rect || rect.width === 0) {
      return;
    }

    setSize(clamp(((clientX - rect.left) / rect.width) * 100));
  };

  const stop = (event: PointerEvent<HTMLElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsResizing(false);
  };

  return {
    size,
    isResizing,
    containerRef: element => {
      containerRef.current = element;
    },
    separatorProps: {
      role: 'separator',
      tabIndex: 0,
      'aria-orientation': 'vertical',
      'aria-valuenow': size,
      'aria-valuemin': minSize,
      'aria-valuemax': maxSize,
      onPointerDown: event => {
        if (event.button !== 0) {
          return;
        }

        // Capture keeps the moves coming when the pointer leaves the
        // separator, and preventDefault stops text selection during the drag.
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        setIsResizing(true);
      },
      onPointerMove: event => {
        if (isResizing) {
          resizeTo(event.clientX);
        }
      },
      onPointerUp: stop,
      onPointerCancel: stop,
      onKeyDown: event => {
        const next = {
          ArrowLeft: size - keyboardStep,
          ArrowRight: size + keyboardStep,
          Home: minSize,
          End: maxSize,
        }[event.key];

        if (next === undefined) {
          return;
        }

        event.preventDefault();
        setSize(clamp(next));
      },
    },
  };
}
