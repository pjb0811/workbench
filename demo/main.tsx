import { Workbench } from '@/index';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Workbench>workbench demo — adapters land in #7/#8</Workbench>
  </StrictMode>,
);
