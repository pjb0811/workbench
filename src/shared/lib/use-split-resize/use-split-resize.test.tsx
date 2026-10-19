// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type SplitResizeOptions, useSplitResize } from './use-split-resize';

const Split = (options: Partial<SplitResizeOptions>) => {
  const { size, isResizing, containerRef, separatorProps } = useSplitResize({
    defaultSize: 20,
    minSize: 15,
    maxSize: 50,
    ...options,
  });

  return (
    <div ref={containerRef} data-testid="container">
      <div data-testid="pane" style={{ width: `${size}%` }} />
      <div
        {...separatorProps}
        aria-label="Resize"
        data-resizing={isResizing || undefined}
      />
    </div>
  );
};

const separator = () => screen.getByRole('separator', { name: 'Resize' });
const size = () => Number(separator().getAttribute('aria-valuenow'));

beforeEach(() => {
  // jsdom has no layout or pointer capture.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 100,
    width: 1000,
  } as DOMRect);
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useSplitResize', () => {
  it('starts at the default size and exposes separator semantics', () => {
    render(<Split />);

    expect(separator().getAttribute('aria-orientation')).toBe('vertical');
    expect(separator().getAttribute('aria-valuemin')).toBe('15');
    expect(separator().getAttribute('aria-valuemax')).toBe('50');
    expect(separator().tabIndex).toBe(0);
    expect(size()).toBe(20);
    expect(screen.getByTestId('pane').style.width).toBe('20%');
  });

  it('follows the pointer as a percentage of the container while dragging', () => {
    render(<Split />);

    fireEvent.pointerMove(separator(), { clientX: 400 });

    expect(size()).toBe(20);

    fireEvent.pointerDown(separator(), { button: 0, pointerId: 1 });

    expect(separator().getAttribute('data-resizing')).toBe('true');
    expect(HTMLElement.prototype.setPointerCapture).toHaveBeenCalledWith(1);

    fireEvent.pointerMove(separator(), { clientX: 400 });

    expect(size()).toBe(30);

    fireEvent.pointerUp(separator(), { pointerId: 1 });
    fireEvent.pointerMove(separator(), { clientX: 500 });

    expect(size()).toBe(30);
    expect(separator().hasAttribute('data-resizing')).toBe(false);
    expect(HTMLElement.prototype.releasePointerCapture).toHaveBeenCalledWith(1);
  });

  it('clamps to the limits', () => {
    render(<Split />);

    fireEvent.pointerDown(separator(), { button: 0, pointerId: 1 });
    fireEvent.pointerMove(separator(), { clientX: 120 });

    expect(size()).toBe(15);

    fireEvent.pointerMove(separator(), { clientX: 1050 });

    expect(size()).toBe(50);
  });

  it('ignores buttons other than the primary one and stops on cancel', () => {
    render(<Split />);

    fireEvent.pointerDown(separator(), { button: 2, pointerId: 1 });
    fireEvent.pointerMove(separator(), { clientX: 400 });

    expect(size()).toBe(20);

    fireEvent.pointerDown(separator(), { button: 0, pointerId: 1 });
    fireEvent.pointerCancel(separator(), { pointerId: 1 });
    fireEvent.pointerMove(separator(), { clientX: 400 });

    expect(size()).toBe(20);
  });

  it('resizes with arrow keys, Home and End', () => {
    render(<Split keyboardStep={5} />);

    fireEvent.keyDown(separator(), { key: 'ArrowRight' });

    expect(size()).toBe(25);

    fireEvent.keyDown(separator(), { key: 'ArrowLeft' });
    fireEvent.keyDown(separator(), { key: 'ArrowLeft' });

    expect(size()).toBe(15);

    fireEvent.keyDown(separator(), { key: 'End' });

    expect(size()).toBe(50);

    fireEvent.keyDown(separator(), { key: 'Home' });

    expect(size()).toBe(15);

    fireEvent.keyDown(separator(), { key: 'a' });

    expect(size()).toBe(15);
  });
});
