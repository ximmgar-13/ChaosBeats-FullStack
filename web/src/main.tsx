import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './index.css';
import { AuthProvider } from './hooks/useAuth';
import { OwnerModeProvider } from './hooks/useOwnerMode';
import { router } from './router';
import { CursorFx } from './components/ui/CursorFx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <OwnerModeProvider>
        <CursorFx />
        <RouterProvider router={router} />
      </OwnerModeProvider>
    </AuthProvider>
  </StrictMode>,
)
