import { AnimatePresence } from 'framer-motion';
import { useApp, AppProvider } from './context/AppContext';
import LandingPage from './components/LandingPage';
import ShareZone from './components/ShareZone';
import ReceiveZone from './components/ReceiveZone';
import Toast from './components/Toast';

function AppRoutes() {
  const { state } = useApp();

  return (
    <div className="min-h-dvh bg-mesh transition-colors duration-300">
      <AnimatePresence mode="wait">
        {state.view === 'landing' && <LandingPage key="landing" />}
        {state.view === 'share'   && <ShareZone key="share" />}
        {state.view === 'receive' && <ReceiveZone key="receive" />}
      </AnimatePresence>
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
