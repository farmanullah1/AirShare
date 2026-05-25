import { createContext, useContext, useReducer, useCallback } from 'react';

const AppContext = createContext(null);

const initialState = {
  view: 'landing',
  roomCode: null,
  role: null,
  peerConnected: false,
  transferActive: false,
  transferComplete: false,
  filesToSend: [],
  toasts: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_VIEW':          return { ...state, view: action.view };
    case 'SET_ROOM_CODE':     return { ...state, roomCode: action.code };
    case 'SET_ROLE':          return { ...state, role: action.role };
    case 'PEER_CONNECTED':    return { ...state, peerConnected: true };
    case 'PEER_DISCONNECTED': return { ...state, peerConnected: false, transferActive: false };
    case 'TRANSFER_START':    return { ...state, transferActive: true, transferComplete: false };
    case 'TRANSFER_DONE':     return { ...state, transferActive: false, transferComplete: true };
    case 'SET_FILES':         return { ...state, filesToSend: action.files };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, { id: Date.now(), ...action.toast }] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) };
    case 'RESET':             return { ...initialState };
    default:                  return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now();
    dispatch({ type: 'ADD_TOAST', toast: { id, message, toastType: type } });
    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', id });
    }, 4000);
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, toast }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
