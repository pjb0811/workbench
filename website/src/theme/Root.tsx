import type { ReactNode } from 'react';

// ui-kit's stylesheet styles the landing page's Button and Card. The
// Workbench demos style themselves through src/css/demo.css.
import '@jbpark/ui-kit/style.css';

export default function Root({ children }: { children: ReactNode }) {
  return children;
}
