import type { ReactNode } from 'react';

// Placeholder — the real widget (adapter wiring, tree + editor composition)
// lands in #12, on top of the FSD structure #6 introduces. This exists for
// now just to give the build pipeline (#4) real JSX to compile and verify
// react/react-dom externalize correctly out of the bundle.
export interface WorkbenchProps {
  children?: ReactNode;
}

export const Workbench = ({ children }: WorkbenchProps) => {
  return <div data-workbench>{children}</div>;
};
