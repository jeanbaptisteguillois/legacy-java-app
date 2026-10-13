import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { exposeServices } from './services/registry';

// Same stylesheets, same order as the AngularJS index.html:
// Bootstrap 3.3.7 first, then the app theme that overrides it through the cascade.
import '../lib/bootstrap/css/bootstrap.min.css';
import '../css/app.css';

/**
 * No retries and no refetch-on-focus: the AngularJS controllers issued exactly
 * one request per activation, and the behavioural suite asserts on call counts.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 0,
      gcTime: 0,
    },
    mutations: { retry: false },
  },
});

exposeServices();

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container #root is missing from index.html');
}

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
