import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ToastContainer } from "../components/Toast/ToastContainer";
import { ToastItem, ToastType } from "../types/toast";

export type { ToastType } from "../types/toast";

interface ToastContextValue {
  showToast: (message: string, type: ToastType) => void;

  removeToast: (id: string) => void;
}

interface ToastProviderProps {
  children: ReactNode;
}

const TOAST_DURATION = 5000;
const DUPLICATE_TOAST_DELAY = 500;

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const createToastId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
};

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const timersRef = useRef<Map<string, number>>(new Map());

  const deadlinesRef = useRef<Map<string, number>>(new Map());

  const remainingTimesRef = useRef<Map<string, number>>(new Map());

  const lastToastRef = useRef<{
    message: string;
    type: ToastType;
    createdAt: number;
  } | null>(null);

  const clearToastTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id);

    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }

    deadlinesRef.current.delete(id);
  }, []);

  const removeToast = useCallback(
    (id: string) => {
      clearToastTimer(id);

      remainingTimesRef.current.delete(id);

      setToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.id !== id),
      );
    },
    [clearToastTimer],
  );

  const scheduleToastRemoval = useCallback(
    (id: string, duration: number) => {
      clearToastTimer(id);

      const safeDuration = Math.max(0, duration);

      if (safeDuration === 0) {
        removeToast(id);
        return;
      }

      remainingTimesRef.current.set(id, safeDuration);

      deadlinesRef.current.set(id, Date.now() + safeDuration);

      const timer = window.setTimeout(() => {
        removeToast(id);
      }, safeDuration);

      timersRef.current.set(id, timer);
    },
    [clearToastTimer, removeToast],
  );

  const pauseToast = useCallback((id: string) => {
    const deadline = deadlinesRef.current.get(id);

    const timer = timersRef.current.get(id);

    if (deadline === undefined || timer === undefined) {
      return;
    }

    const remainingTime = Math.max(0, deadline - Date.now());

    window.clearTimeout(timer);

    timersRef.current.delete(id);
    deadlinesRef.current.delete(id);

    remainingTimesRef.current.set(id, remainingTime);
  }, []);

  const resumeToast = useCallback(
    (id: string) => {
      if (timersRef.current.has(id)) {
        return;
      }

      const remainingTime = remainingTimesRef.current.get(id);

      if (remainingTime === undefined) {
        return;
      }

      scheduleToastRemoval(id, remainingTime);
    },
    [scheduleToastRemoval],
  );

  const showToast = useCallback(
    (message: string, type: ToastType) => {
      const normalizedMessage = message.trim();

      if (!normalizedMessage) {
        return;
      }

      const currentTime = Date.now();

      const lastToast = lastToastRef.current;

      if (
        lastToast &&
        lastToast.message === normalizedMessage &&
        lastToast.type === type &&
        currentTime - lastToast.createdAt < DUPLICATE_TOAST_DELAY
      ) {
        return;
      }

      lastToastRef.current = {
        message: normalizedMessage,
        type,
        createdAt: currentTime,
      };

      const id = createToastId();

      setToasts((currentToasts) => [
        ...currentToasts,
        {
          id,
          message: normalizedMessage,
          type,
        },
      ]);

      scheduleToastRemoval(id, TOAST_DURATION);
    },
    [scheduleToastRemoval],
  );

  useEffect(() => {
    const timers = timersRef.current;

    const deadlines = deadlinesRef.current;

    const remainingTimes = remainingTimesRef.current;

    return () => {
      timers.forEach((timer) => {
        window.clearTimeout(timer);
      });

      timers.clear();
      deadlines.clear();
      remainingTimes.clear();
    };
  }, []);

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      showToast,
      removeToast,
    }),
    [showToast, removeToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
        onPause={pauseToast}
        onResume={resumeToast}
      />
    </ToastContext.Provider>
  );
};
