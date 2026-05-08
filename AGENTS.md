# AI Agent Instructions for practice-app

## Project overview
- A React + TypeScript + Vite single-page application for a business management dashboard.
- Pages include login, dashboard, projects, and DSA record entry.
- Uses Tailwind CSS for layout and styling, React Router for navigation, and TanStack React Query for data fetching support.
- Supabase is initialized in `src/lib/supabaseClient.ts`, but the current app mostly uses local state in pages like `src/pages/DSA.tsx`.

## Key files
- `src/main.tsx` - application entry; wraps the app in `QueryClientProvider`.
- `src/App.tsx` - route definitions and simple auth/role state.
- `src/components/MainLayout.tsx` - sidebar layout, topbar, role-aware navigation.
- `src/pages/DSA.tsx` - DSA logging page with form and local state list.
- `src/lib/supabaseClient.ts` - Supabase client setup from env vars.

## Important conventions
- Use Tailwind utility classes directly in JSX for styling.
- Keep page-level routes in `src/pages` and shared layout/UI in `src/components`.
- Authentication is currently simulated with React state in `App.tsx`; `user.role` controls admin-only access to the finance page.
- The codebase is small and direct: prefer simple functional components, hooks, and minimal abstraction.

## Build and dev commands
- `npm run dev` - start the Vite development server
- `npm run build` - compile TypeScript and build production assets
- `npm run lint` - run ESLint across the project

## Notes for AI helpers
- Do not assume a backend exists yet for features like project assignment or financial records; current pages are mostly local state or placeholders.
- When adding business features, preserve the existing Tailwind design language and component structure.
- If adding persistence, use `src/lib/supabaseClient.ts` and environment variables `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
- Keep instructions concise and refer to this file for project-specific patterns rather than duplicating general React/Vite setup.
