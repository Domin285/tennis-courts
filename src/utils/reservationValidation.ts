import { COURTS, CourtId } from "../types/courts";
import {
  CreateReservationPayload,
  Reservation,
  ReservationActionResult,
} from "../types/reservation";
import { isSameDay, minutesBetween, parseDate } from "./date";

export const COURT_OPENING_HOUR = 7;
export const COURT_CLOSING_HOUR = 21;
export const MIN_RESERVATION_MINUTES = 60;

export const MAX_FIRST_NAME_LENGTH = 60;
export const MAX_LAST_NAME_LENGTH = 80;
export const MAX_EMAIL_LENGTH = 160;
export const MAX_NOTES_LENGTH = 500;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ReservationData = Omit<Reservation, "id" | "createdAt">;

export const normalizeReservationData = (
  payload: CreateReservationPayload | ReservationData,
): ReservationData => ({
  courtId: payload.courtId,
  start: payload.start,
  end: payload.end,
  firstName: payload.firstName.trim(),
  lastName: payload.lastName.trim(),
  email: payload.email.trim().toLowerCase(),
  notes: payload.notes?.trim() || undefined,
});

const isKnownCourt = (courtId: string): courtId is CourtId =>
  Object.prototype.hasOwnProperty.call(COURTS, courtId);

const isWithinOpeningHours = (start: Date, end: Date): boolean => {
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  const openingMinutes = COURT_OPENING_HOUR * 60;
  const closingMinutes = COURT_CLOSING_HOUR * 60;

  return (
    startMinutes >= openingMinutes &&
    endMinutes <= closingMinutes &&
    endMinutes > startMinutes
  );
};

export const validateReservationData = (
  payload: ReservationData,
  options: {
    allowPastStart?: boolean;
  } = {},
): ReservationActionResult => {
  if (!isKnownCourt(payload.courtId)) {
    return {
      ok: false,
      error: "Wybrano nieprawidłowy kort.",
    };
  }

  const start = parseDate(payload.start);
  const end = parseDate(payload.end);

  if (!start || !end) {
    return {
      ok: false,
      error: "Podano nieprawidłową datę rezerwacji.",
    };
  }

  if (!options.allowPastStart && start.getTime() < Date.now()) {
    return {
      ok: false,
      error: "Nie można tworzyć rezerwacji w przeszłości.",
    };
  }

  if (end.getTime() <= start.getTime()) {
    return {
      ok: false,
      error: "Koniec rezerwacji musi być późniejszy niż jej początek.",
    };
  }

  if (!isSameDay(start, end)) {
    return {
      ok: false,
      error: "Rezerwacja musi rozpoczynać się i kończyć tego samego dnia.",
    };
  }

  if (minutesBetween(start, end) < MIN_RESERVATION_MINUTES) {
    return {
      ok: false,
      error: `Rezerwacja musi trwać co najmniej ${MIN_RESERVATION_MINUTES} minut.`,
    };
  }

  if (!isWithinOpeningHours(start, end)) {
    return {
      ok: false,
      error: `Rezerwacji można dokonywać w godzinach ${COURT_OPENING_HOUR}:00–${COURT_CLOSING_HOUR}:00.`,
    };
  }

  if (!payload.firstName) {
    return {
      ok: false,
      error: "Podaj imię.",
    };
  }

  if (payload.firstName.length > MAX_FIRST_NAME_LENGTH) {
    return {
      ok: false,
      error: `Imię może mieć maksymalnie ${MAX_FIRST_NAME_LENGTH} znaków.`,
    };
  }

  if (!payload.lastName) {
    return {
      ok: false,
      error: "Podaj nazwisko.",
    };
  }

  if (payload.lastName.length > MAX_LAST_NAME_LENGTH) {
    return {
      ok: false,
      error: `Nazwisko może mieć maksymalnie ${MAX_LAST_NAME_LENGTH} znaków.`,
    };
  }

  if (!payload.email) {
    return {
      ok: false,
      error: "Podaj adres e-mail.",
    };
  }

  if (
    payload.email.length > MAX_EMAIL_LENGTH ||
    !EMAIL_PATTERN.test(payload.email)
  ) {
    return {
      ok: false,
      error: "Podaj prawidłowy adres e-mail.",
    };
  }

  if ((payload.notes?.length ?? 0) > MAX_NOTES_LENGTH) {
    return {
      ok: false,
      error: `Notatki mogą mieć maksymalnie ${MAX_NOTES_LENGTH} znaków.`,
    };
  }

  return { ok: true };
};

export const hasReservationConflict = (
  reservations: Reservation[],
  courtId: CourtId,
  startIso: string,
  endIso: string,
  ignoredReservationId?: string,
): boolean => {
  const start = parseDate(startIso);
  const end = parseDate(endIso);

  if (!start || !end) {
    return true;
  }

  return reservations.some((reservation) => {
    if (reservation.courtId !== courtId) {
      return false;
    }

    if (ignoredReservationId && reservation.id === ignoredReservationId) {
      return false;
    }

    const reservationStart = parseDate(reservation.start);
    const reservationEnd = parseDate(reservation.end);

    if (!reservationStart || !reservationEnd) {
      return false;
    }

    return start < reservationEnd && end > reservationStart;
  });
};
