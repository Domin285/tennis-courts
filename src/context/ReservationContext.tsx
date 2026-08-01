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
import {
  CreateReservationPayload,
  Reservation,
  ReservationActionResult,
  UpdateReservationPayload,
} from "../types/reservation";
import { CourtId } from "../types/courts";
import {
  hasReservationConflict,
  normalizeReservationData,
  validateReservationData,
} from "../utils/reservationValidation";
import {
  loadReservations,
  saveReservations,
} from "../utils/reservationStorage";

interface ReservationContextValue {
  reservations: Reservation[];

  createReservation: (
    payload: CreateReservationPayload,
  ) => ReservationActionResult;

  updateReservation: (
    payload: UpdateReservationPayload,
  ) => ReservationActionResult;

  deleteReservation: (id: string) => boolean;

  isSlotAvailable: (
    courtId: CourtId,
    start: string,
    end: string,
    ignoreId?: string,
  ) => boolean;
}

interface ReservationProviderProps {
  children: ReactNode;
}

const EXPIRED_RESERVATION_CHECK_INTERVAL = 60_000;

const ReservationContext = createContext<ReservationContextValue | undefined>(
  undefined,
);

const createReservationId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const removeExpiredReservations = (
  currentReservations: Reservation[],
  currentTime = Date.now(),
): Reservation[] => {
  const activeReservations = currentReservations.filter((reservation) => {
    const reservationEndTime = new Date(reservation.end).getTime();

    return (
      Number.isFinite(reservationEndTime) && reservationEndTime > currentTime
    );
  });

  if (activeReservations.length === currentReservations.length) {
    return currentReservations;
  }

  return activeReservations;
};

export const useReservations = (): ReservationContextValue => {
  const context = useContext(ReservationContext);

  if (!context) {
    throw new Error("useReservations must be used within ReservationProvider");
  }

  return context;
};

export const ReservationProvider = ({ children }: ReservationProviderProps) => {
  const initialReservations = useMemo(
    () => removeExpiredReservations(loadReservations()),
    [],
  );

  const [reservations, setReservations] =
    useState<Reservation[]>(initialReservations);

  const reservationsRef = useRef<Reservation[]>(initialReservations);

  const commitReservations = useCallback((nextReservations: Reservation[]) => {
    reservationsRef.current = nextReservations;

    setReservations(nextReservations);
  }, []);

  useEffect(() => {
    saveReservations(reservations);
  }, [reservations]);

  const cleanupExpiredReservations = useCallback(() => {
    const currentReservations = reservationsRef.current;

    const activeReservations = removeExpiredReservations(currentReservations);

    if (activeReservations === currentReservations) {
      return;
    }

    commitReservations(activeReservations);
  }, [commitReservations]);

  useEffect(() => {
    const handleWindowFocus = () => {
      cleanupExpiredReservations();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        cleanupExpiredReservations();
      }
    };

    cleanupExpiredReservations();

    const intervalId = window.setInterval(
      cleanupExpiredReservations,
      EXPIRED_RESERVATION_CHECK_INTERVAL,
    );

    window.addEventListener("focus", handleWindowFocus);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);

      window.removeEventListener("focus", handleWindowFocus);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [cleanupExpiredReservations]);

  const isSlotAvailable = useCallback(
    (
      courtId: CourtId,
      start: string,
      end: string,
      ignoreId?: string,
    ): boolean =>
      !hasReservationConflict(
        reservationsRef.current,
        courtId,
        start,
        end,
        ignoreId,
      ),
    [],
  );

  const createReservation = useCallback(
    (payload: CreateReservationPayload): ReservationActionResult => {
      const currentReservations = removeExpiredReservations(
        reservationsRef.current,
      );

      if (currentReservations !== reservationsRef.current) {
        commitReservations(currentReservations);
      }

      const normalized = normalizeReservationData(payload);

      const validationResult = validateReservationData(normalized);

      if (!validationResult.ok) {
        return validationResult;
      }

      if (
        hasReservationConflict(
          currentReservations,
          normalized.courtId,
          normalized.start,
          normalized.end,
        )
      ) {
        return {
          ok: false,
          error: "Wybrany termin dla tego kortu jest już zajęty.",
        };
      }

      const newReservation: Reservation = {
        id: createReservationId(),
        createdAt: new Date().toISOString(),
        ...normalized,
      };

      commitReservations([...currentReservations, newReservation]);

      return {
        ok: true,
      };
    },
    [commitReservations],
  );

  const updateReservation = useCallback(
    (payload: UpdateReservationPayload): ReservationActionResult => {
      const currentReservations = removeExpiredReservations(
        reservationsRef.current,
      );

      if (currentReservations !== reservationsRef.current) {
        commitReservations(currentReservations);
      }

      const reservationIndex = currentReservations.findIndex(
        (reservation) => reservation.id === payload.id,
      );

      if (reservationIndex === -1) {
        return {
          ok: false,
          error: "Nie znaleziono wybranej rezerwacji.",
        };
      }

      const currentReservation = currentReservations[reservationIndex];

      const mergedReservation: Reservation = {
        ...currentReservation,
        ...payload,
      };

      const normalized = normalizeReservationData(mergedReservation);

      const validationResult = validateReservationData(normalized);

      if (!validationResult.ok) {
        return validationResult;
      }

      if (
        hasReservationConflict(
          currentReservations,
          normalized.courtId,
          normalized.start,
          normalized.end,
          currentReservation.id,
        )
      ) {
        return {
          ok: false,
          error: "Zmieniony termin koliduje z inną rezerwacją.",
        };
      }

      const updatedReservation: Reservation = {
        ...currentReservation,
        ...normalized,
      };

      const nextReservations = [...currentReservations];

      nextReservations[reservationIndex] = updatedReservation;

      commitReservations(nextReservations);

      return {
        ok: true,
      };
    },
    [commitReservations],
  );

  const deleteReservation = useCallback(
    (id: string): boolean => {
      const currentReservations = reservationsRef.current;

      const reservationExists = currentReservations.some(
        (reservation) => reservation.id === id,
      );

      if (!reservationExists) {
        return false;
      }

      commitReservations(
        currentReservations.filter((reservation) => reservation.id !== id),
      );

      return true;
    },
    [commitReservations],
  );

  const contextValue = useMemo<ReservationContextValue>(
    () => ({
      reservations,
      createReservation,
      updateReservation,
      deleteReservation,
      isSlotAvailable,
    }),
    [
      reservations,
      createReservation,
      updateReservation,
      deleteReservation,
      isSlotAvailable,
    ],
  );

  return (
    <ReservationContext.Provider value={contextValue}>
      {children}
    </ReservationContext.Provider>
  );
};
