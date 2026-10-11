import type { ReactNode } from 'react';

// Placeholder — the real widget (adapter wiring, tree + editor composition)
// lands in #12, now that the FSD structure (#6) is in place. Kept for now so
// the build pipeline (#4) has real JSX to compile and verify react/react-dom
// externalize correctly out of the bundle.
export interface WorkbenchProps {
  children?: ReactNode;
}

export const Workbench = ({ children }: WorkbenchProps) => {
  return <div data-workbench>{children}</div>;
};
