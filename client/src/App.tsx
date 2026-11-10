import { AppRouter } from '@/routes/AppRouter'

/** Kept for compatibility; bootstrap uses main.tsx → AppRouter directly. */
export default function App() {
  return <AppRouter />
}
